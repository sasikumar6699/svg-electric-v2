const fs = require('fs');
const readline = require('readline');

async function processLineByLine() {
  const p = 'C:/Users/LENOVO/.gemini/antigravity/brain/646b3c2e-ac0d-47d9-8f88-9fe70d59109f/.system_generated/logs/transcript_full.jsonl';
  const fileStream = fs.createReadStream(p);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let foundContent = null;
  for await (const line of rl) {
    if (line.includes('"type":"USER_INPUT"') && line.includes('MCB-0001')) {
      try {
        const parsed = JSON.parse(line);
        if (parsed.type === 'USER_INPUT' && parsed.content) {
          foundContent = parsed.content;
        }
      } catch (err) {}
    }
  }

  if (foundContent) {
    console.log('Found USER_INPUT! Length:', foundContent.length);
    fs.writeFileSync('prisma/user-prompt-full.txt', foundContent, 'utf8');
    console.log('Saved to prisma/user-prompt-full.txt');
  } else {
    console.log('USER_INPUT not found in transcript_full');
  }
}
processLineByLine();
