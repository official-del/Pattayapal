const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/UserAuth.jsx');
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes('const [successMsg, setSuccessMsg]')) {
    content = content.replace(
        "const [errorMsg, setErrorMsg] = useState('');", 
        "const [errorMsg, setErrorMsg] = useState('');\n  const [successMsg, setSuccessMsg] = useState('');"
    );
}

if (!content.includes('{successMsg &&')) {
    content = content.replace(
        "<form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>",
        `{successMsg && (
          <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '15px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '700', marginBottom: '20px', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>`
    );
}

fs.writeFileSync(filePath, content);
console.log('UserAuth.jsx updated');
