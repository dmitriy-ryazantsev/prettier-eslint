const esbuild = require('esbuild');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

async function main() {
    const ctx = await esbuild.context({
        entryPoints: ['src/extension.ts'],
        bundle: true,
        format: 'cjs',
        minify: production,
        sourcemap: !production,
        sourcesContent: false,
        platform: 'node',
        outfile: 'out/extension.js',
        external: ['vscode'],
        logLevel: 'info',
        mainFields: ['module', 'main'],
        metafile: true,
        // Handle optional dependencies that might not be installed
        plugins: [{
            name: 'optional-require',
            setup(build) {
                // Mark jiti as external since it's an optional dependency of eslint
                build.onResolve({ filter: /^jiti$/ }, args => {
                    return { path: args.path, external: true };
                });
                build.onResolve({ filter: /^jiti\/package\.json$/ }, args => {
                    return { path: args.path, external: true };
                });
            }
        }]
    });

    if (watch) {
        await ctx.watch();
    } else {
        await ctx.rebuild();
        await ctx.dispose();
    }
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
