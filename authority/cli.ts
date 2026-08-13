import { createAtlasAuthority } from "./atlas";

const query = process.argv.slice(2).join(" ") || "Why must InvoiceLedger apply keep the idempotency check?";
const authority = createAtlasAuthority();
const packet = authority.compile(query, "atlas-demo", "atlas/core");
process.stdout.write(`${JSON.stringify(packet, null, 2)}\n`);
