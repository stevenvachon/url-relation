"use strict";
// @todo try https://npmjs.com/json-preserve-indent ?
const newData = require("./tests.json");
const orgData = require("./tests-bak.json");

for (let i=0; i<newData.length; i++)
{
  const newDatum = newData[i];

  for (let j=0; j<orgData.length; j++)
  {
    const orgDatum = orgData[j];

    if (orgDatum.url1!==newDatum.url1 || orgDatum.url2!==newDatum.url2)
    {
      continue;
    }

    newDatum.relation = orgDatum.relation;

    break;
  }
}

require("fs").writeFileSync(
  `${__dirname}/tests.json`,
  JSON.stringify(newData, null, "\t") + "\n"
);
