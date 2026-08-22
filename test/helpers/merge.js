import newData from './tests.json' with { type: 'json' };
import orgData from './tests-bak.json' with { type: 'json' };
import { writeFileSync } from 'fs';

for (const newDatum of newData) {
  for (const orgDatum of orgData) {
    if (orgDatum.url1 !== newDatum.url1 || orgDatum.url2 !== newDatum.url2) {
      continue;
    }
    newDatum.relation = orgDatum.relation;
    break;
  }
}

writeFileSync(
  `${import.meta.dirname}/tests.json`,
  `${JSON.stringify(newData, null, '\t')}\n` // Extra line break for unix/git
);
