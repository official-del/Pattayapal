
const html = `
  <meta property="og:title" content="Pattayapal Portfolio | Community & Workspace for Freelancers" />
  <meta property="og:description"
    content="แพลตฟอร์มสำหรับฟรีแลนซ์คุณภาพ รวมผลงานที่ดีที่สุด และชุมชนที่พร้อมเติบโตไปด้วยกัน" />
  <meta property="og:image" content="https://pattayapal.com/og-image.jpg" />
`;

const replaceMeta = (tagHtml, property, value, attr = 'property') => {
  const regex = new RegExp(`<meta\\s+${attr}="${property}"[\\s\\S]*?content="[\\s\\S]*?"\\s*\\/>`, 'g');
  return tagHtml.replace(regex, `<meta ${attr}="${property}" content="${value}" />`);
};

console.log("Replacing Title:");
console.log(replaceMeta(html, 'og:title', 'NEW TITLE'));

console.log("\nReplacing Description (multiline):");
console.log(replaceMeta(html, 'og:description', 'NEW DESCRIPTION'));

console.log("\nReplacing Image:");
console.log(replaceMeta(html, 'og:image', 'https://example.com/image.jpg'));
