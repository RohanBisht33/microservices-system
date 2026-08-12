#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
CERTS_DIR="$ROOT_DIR/nats/certs"

mkdir -p "$CERTS_DIR"

echo "Generating development self-signed TLS certificates for NATS..."
echo "WARNING: DO NOT USE THESE CERTIFICATES IN PRODUCTION."

# 1. Generate Root CA
openssl req -x509 -newkey rsa:4096 -nodes -keyout "$CERTS_DIR/ca.key" -out "$CERTS_DIR/ca.crt" -days 365 -subj "/CN=NATS-Dev-CA" 2>/dev/null

# 2. Generate Server Key & CSR
openssl req -newkey rsa:2048 -nodes -keyout "$CERTS_DIR/server.key" -out "$CERTS_DIR/server.csr" -subj "/CN=nats" 2>/dev/null

# 3. Create SAN Extension file for nats hostnames
cat <<EOF > "$CERTS_DIR/san.cnf"
[req]
req_extensions = v3_req
distinguished_name = req_distinguished_name

[req_distinguished_name]

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = nats
DNS.2 = localhost
IP.1 = 127.0.0.1
EOF

# 4. Sign Server Certificate with CA
openssl x509 -req -in "$CERTS_DIR/server.csr" -CA "$CERTS_DIR/ca.crt" -CAkey "$CERTS_DIR/ca.key" -CAcreateserial -out "$CERTS_DIR/server.crt" -days 365 -extfile "$CERTS_DIR/san.cnf" -extensions v3_req 2>/dev/null

# Clean up CSR & CNF
rm -f "$CERTS_DIR/server.csr" "$CERTS_DIR/san.cnf"

# Set permissions
chmod 600 "$CERTS_DIR"/*.key
chmod 644 "$CERTS_DIR"/*.crt

echo "Certificates generated successfully in $CERTS_DIR:"
ls -l "$CERTS_DIR"
