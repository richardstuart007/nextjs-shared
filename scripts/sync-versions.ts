import { action_syncVersions } from '../src/UI/OwnerSyncVersions_actions'

async function main() {
  const results = await action_syncVersions()
  for (const r of results) {
    console.log(`\n${r.project}`)
    console.log(`  .npmrc: ${r.npmrc}`)
    if (r.changes.length === 0) {
      console.log('  Already aligned')
    } else {
      for (const c of r.changes) console.log(`  ${c}`)
    }
  }
  console.log('\nDone. Run "npm install --force" in each project to apply changes.\n')
}

main()
