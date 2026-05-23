const fs = require('fs');
let file = fs.readFileSync('Production/src/pages/UserProfile.jsx', 'utf8');
const searchStr = '<option value="Content Creator">Content Creator</option>';
const replaceStr = '<option value="Content Creator">Content Creator</option>\\n                              <option value="Tutor">Tutor</option>';
if (file.includes(searchStr)) {
  file = file.replace(searchStr, replaceStr);
  fs.writeFileSync('Production/src/pages/UserProfile.jsx', file);
  console.log('Successfully patched UserProfile.jsx');
} else {
  console.log('Target string not found');
}
