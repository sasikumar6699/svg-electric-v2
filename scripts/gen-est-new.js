const fs = require('fs'); let c = '';
c += \'use client';\n\nimport React, { useState, useEffect } from 'react';\nimport { useRouter } from 'next/navigation';\nimport { formatINR, numberToIndianWords } from '@/lib/utils';\nimport {\n  PlusCircle,\n  Trash2,\n  AlertCircle,\n  Building,\n  Calendar,\n  X,\n  Layers,\n  FileCheck,\n  Loader2,\n} from 'lucide-react';\n\;
