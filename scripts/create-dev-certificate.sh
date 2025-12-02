#!/bin/bash
# Create a self-signed code signing certificate for local development
# This certificate gives the app a stable identity so accessibility permissions persist

set -e

CERT_NAME="PromptLight Dev"

echo "Creating self-signed code signing certificate: '$CERT_NAME'"
echo ""

# Check if certificate already exists
if security find-identity -v -p codesigning | grep -q "$CERT_NAME"; then
    echo "Certificate '$CERT_NAME' already exists."
    security find-identity -v -p codesigning | grep "$CERT_NAME"
    exit 0
fi

cd /tmp

# Create CA certificate
cat > ca.cfg << 'EOF'
[req]
distinguished_name = req_dn
x509_extensions = v3_ca
prompt = no

[req_dn]
CN = PromptLight CA

[v3_ca]
basicConstraints = critical, CA:TRUE
keyUsage = critical, keyCertSign, cRLSign
EOF

openssl genrsa -out ca.key 2048 2>/dev/null
openssl req -x509 -new -key ca.key -out ca.crt -days 3650 -config ca.cfg 2>/dev/null

# Create code signing certificate
cat > codesign.cfg << 'EOF'
[req]
distinguished_name = req_dn
prompt = no

[req_dn]
CN = PromptLight Dev
EOF

openssl genrsa -out codesign.key 2048 2>/dev/null
openssl req -new -key codesign.key -out codesign.csr -config codesign.cfg 2>/dev/null

cat > codesign_ext.cfg << 'EOF'
keyUsage = critical, digitalSignature
extendedKeyUsage = critical, codeSigning
EOF

openssl x509 -req -in codesign.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out codesign.crt -days 3650 -extfile codesign_ext.cfg 2>/dev/null

# Create PKCS12 and import
openssl pkcs12 -export -in codesign.crt -inkey codesign.key -out codesign.p12 -name "$CERT_NAME" -passout pass:dev123 -legacy 2>/dev/null || \
openssl pkcs12 -export -in codesign.crt -inkey codesign.key -out codesign.p12 -name "$CERT_NAME" -passout pass:dev123

echo "Importing certificate to keychain..."
security import codesign.p12 -k ~/Library/Keychains/login.keychain-db -P "dev123" -T /usr/bin/codesign

# Trust the CA
security add-trusted-cert -d -r trustRoot -k ~/Library/Keychains/login.keychain-db ca.crt 2>/dev/null || true

# Cleanup
rm -f ca.cfg ca.key ca.crt ca.srl codesign.cfg codesign.key codesign.csr codesign.crt codesign_ext.cfg codesign.p12

echo ""
echo "Certificate created successfully!"
security find-identity -v -p codesigning | grep "$CERT_NAME"
echo ""
echo "You may need to open Keychain Access and set 'PromptLight Dev' to 'Always Trust' for Code Signing."
