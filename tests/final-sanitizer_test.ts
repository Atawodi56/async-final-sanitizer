import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.5.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.170.0/testing/asserts.ts';

Clarinet.test({
    name: "Ensures core resource management functionality",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const testUser = accounts.get('wallet_1')!;

        // Test resource registration
        let block = chain.mineBlock([
            Tx.contractCall('final-sanitizer', 'update-resource', [
                types.uint(1),
                types.ascii('Tech Prototype'),
                types.uint(50000),
                types.ascii('Operational'),
                types.some(types.utf8('ipfs://example-hash'))
            ], deployer.address)
        ]);

        // Validate successful registration
        assertEquals(block.height, 2);
        assertEquals(block.receipts.length, 1);
        block.receipts[0].result.expectOk();
    }
});

Clarinet.test({
    name: "Validates resource ownership transfer restrictions",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const testUser = accounts.get('wallet_1')!;

        // Attempt unauthorized transfer
        let block = chain.mineBlock([
            Tx.contractCall('final-sanitizer', 'update-resource', [
                types.uint(1),
                types.ascii('Updated Prototype'),
                types.uint(55000),
                types.ascii('Modified'),
                types.some(types.utf8('ipfs://updated-hash'))
            ], testUser.address)
        ]);

        // Validate unauthorized access
        block.receipts[0].result.expectErr().expectUint(100); // Unauthorized
    }
});

Clarinet.test({
    name: "Ensures resource deactivation mechanism",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;

        // Deactivate resource
        let block = chain.mineBlock([
            Tx.contractCall('final-sanitizer', 'deactivate-resource', [
                types.uint(1),
                types.ascii('Obsolete technology')
            ], deployer.address)
        ]);

        // Validate successful deactivation
        block.receipts[0].result.expectOk();

        // Verify resource status
        const resourceDetails = chain.callReadOnlyFn('final-sanitizer', 'get-resource', [types.uint(1)], deployer.address);
        resourceDetails.result.expectSome();
    }
});