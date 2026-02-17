const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
const content = fs.readFileSync(schemaPath, 'utf8');

// Normalize line endings to CRLF
const newContent = content.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');

fs.writeFileSync(schemaPath, newContent);
console.log('Fixed line endings in schema.prisma');
