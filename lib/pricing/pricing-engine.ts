import { db } from '@/lib/db';

export interface PriceCalculationInput {
  productId: string;
  specifications: Record<string, string | number | boolean | string[]>;
  quantity: number;
  manualPriceOverride?: number | null;
}

export interface SpecificationPriceItem {
  specCode: string;
  specName: string;
  optionValue: string;
  optionLabel: string;
  price: number;
}

export interface PriceCalculationSuccess {
  success: true;
  unitPrice: number;
  quantity: number;
  lineAmount: number;
  priceRuleId?: string | null;
  pricingStrategy: 'ADDITIVE_SPECIFICATIONS' | 'MANUAL_OVERRIDE' | 'FIXED_SPECIFICATION_COMBINATION';
  isManualPrice: boolean;
  breakdown: {
    productBasePrice: number;
    optionsBreakdown: SpecificationPriceItem[];
    optionsTotal: number;
    calculatedUnitPrice: number;
    specificationSummary: Record<string, string>;
  };
  notes?: string;
}

export interface PriceCalculationError {
  success: false;
  error: string;
}

export type PriceCalculationResult = PriceCalculationSuccess | PriceCalculationError;

/**
 * Normalizes a specification map into a deterministic sorted criteria string.
 * Example: {"current": "1000A", "voltage": "415V"} -> "CURRENT:1000A|VOLTAGE:415V"
 */
export function buildCriteriaHash(specs: Record<string, any>): string {
  const keys = Object.keys(specs).sort();
  const pairs: string[] = [];

  for (const k of keys) {
    let val = specs[k];
    if (val === undefined || val === null || val === '') continue;
    if (Array.isArray(val)) {
      val = val.slice().sort().join(',');
    }
    pairs.push(`${k.trim().toUpperCase()}:${String(val).trim().toUpperCase()}`);
  }

  return pairs.join('|');
}

/**
 * Core Pricing Engine
 * Implements:
 * 1. Additive Specification Pricing: Product Base Price + Sum(Selected Option Prices)
 * 2. Manual Price Override capability
 * 3. Fallback to Fixed Combination Pricing Rules if defined
 */
export class PricingEngine {
  /**
   * Calculates the unit price and line total for a given product and specifications.
   */
  static async calculatePrice(input: PriceCalculationInput): Promise<PriceCalculationResult> {
    const { productId, specifications, quantity, manualPriceOverride } = input;

    if (!productId) {
      return { success: false, error: 'Product is mandatory for price estimation.' };
    }

    if (!quantity || quantity <= 0) {
      return { success: false, error: 'Quantity must be greater than 0.' };
    }

    // Retrieve product with its configured specifications and active options
    const product = await db.product.findUnique({
      where: { id: productId },
      include: {
        productSpecs: {
          include: {
            specification: {
              include: {
                options: {
                  where: { active: true },
                  orderBy: { displayOrder: 'asc' },
                },
              },
            },
          },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    if (!product || !product.active) {
      return { success: false, error: 'The selected product is inactive or not found.' };
    }

    // Validate that all required specifications are provided
    for (const ps of product.productSpecs) {
      if (ps.isRequired && ps.specification.active) {
        const specCode = ps.specification.code;
        const val = specifications[specCode];
        if (val === undefined || val === null || val === '') {
          return {
            success: false,
            error: `Required specification "${ps.specification.name}" must be selected.`,
          };
        }
      }
    }

    // 1. Calculate Additive Specification Prices
    let optionsTotal = 0;
    const optionsBreakdown: SpecificationPriceItem[] = [];
    const specSummary: Record<string, string> = {};

    for (const ps of product.productSpecs) {
      const spec = ps.specification;
      const specCode = spec.code;
      const val = specifications[specCode];

      if (val !== undefined && val !== null && val !== '') {
        const valStr = String(val);
        specSummary[specCode] = valStr;

        // Find matching option
        const matchedOption = spec.options.find(
          (opt) => opt.value.trim().toUpperCase() === valStr.trim().toUpperCase()
        );

        const optionPrice = matchedOption ? matchedOption.price : 0.0;
        const optionLabel = matchedOption ? matchedOption.label : valStr;

        optionsTotal += optionPrice;
        optionsBreakdown.push({
          specCode,
          specName: spec.name,
          optionValue: valStr,
          optionLabel,
          price: optionPrice,
        });
      }
    }

    const productBasePrice = product.basePrice || 0;
    let calculatedUnitPrice = productBasePrice + optionsTotal;
    let priceRuleId: string | null = null;
    let ruleNotes: string | undefined = undefined;

    // Check if a fixed pricing rule exists as fallback or explicit match
    const criteriaHash = buildCriteriaHash(specifications);
    const now = new Date();
    const rule = await db.pricingRule.findFirst({
      where: {
        productId,
        criteriaHash,
        active: true,
        effectiveFrom: { lte: now },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: now } },
        ],
      },
      orderBy: {
        effectiveFrom: 'desc',
      },
    });

    if (rule) {
      priceRuleId = rule.id;
      ruleNotes = rule.notes || undefined;
      // If no option prices were configured (total was 0) but a rule exists, use rule basePrice
      if (calculatedUnitPrice === 0 && rule.basePrice > 0) {
        calculatedUnitPrice = rule.basePrice;
      }
    }

    // Determine if manual price override is applied
    const isManualPrice =
      manualPriceOverride !== undefined &&
      manualPriceOverride !== null &&
      !isNaN(Number(manualPriceOverride)) &&
      Number(manualPriceOverride) >= 0;

    const unitPrice = isManualPrice ? Number(manualPriceOverride) : calculatedUnitPrice;
    const lineAmount = Math.round(unitPrice * quantity * 100) / 100;

    let pricingStrategy: 'ADDITIVE_SPECIFICATIONS' | 'MANUAL_OVERRIDE' | 'FIXED_SPECIFICATION_COMBINATION' = 'ADDITIVE_SPECIFICATIONS';
    if (isManualPrice) {
      pricingStrategy = 'MANUAL_OVERRIDE';
    } else if (rule && calculatedUnitPrice === rule.basePrice && optionsTotal === 0) {
      pricingStrategy = 'FIXED_SPECIFICATION_COMBINATION';
    }

    return {
      success: true,
      unitPrice,
      quantity,
      lineAmount,
      priceRuleId,
      pricingStrategy,
      isManualPrice,
      breakdown: {
        productBasePrice,
        optionsBreakdown,
        optionsTotal,
        calculatedUnitPrice,
        specificationSummary: specSummary,
      },
      notes: ruleNotes,
    };
  }
}
