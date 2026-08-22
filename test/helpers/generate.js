import { writeFileSync } from 'fs';

const urls = [
  // Parts removing from right to left
  'http://user:pass@www.domain.com:80/test//tes.ter/./../index.html?va r1= +dir&var2=text&var3#anchor',
  'http://user:pass@www.domain.com:80/test//tes.ter/./../index.html?va r1= +dir&var2=text&var3#',
  'http://user:pass@www.domain.com:80/test//tes.ter/./../index.html?va r1= +dir&var2=text&var3',
  'http://user:pass@www.domain.com:80/test//tes.ter/./../index.html?va r1= +dir&var2=text&',
  'http://user:pass@www.domain.com:80/test//tes.ter/./../index.html?va r1= +dir&var2=text',
  'http://user:pass@www.domain.com:80/test//tes.ter/./../index.html?va r1= +dir&var2=',
  'http://user:pass@www.domain.com:80/test//tes.ter/./../index.html?va r1= +dir&var2',
  'http://user:pass@www.domain.com:80/test//tes.ter/./../index.html?va r1= +dir&',
  'http://user:pass@www.domain.com:80/test//tes.ter/./../index.html?va r1= +dir',
  'http://user:pass@www.domain.com:80/test//tes.ter/./../index.html?va r1=',
  'http://user:pass@www.domain.com:80/test//tes.ter/./../index.html?va r1',
  'http://user:pass@www.domain.com:80/test//tes.ter/./../index.html?',
  'http://user:pass@www.domain.com:80/test//tes.ter/./../index.html',
  'http://user:pass@www.domain.com:80/test//tes.ter/./../index',
  'http://user:pass@www.domain.com:80/test//tes.ter/./../',
  'http://user:pass@www.domain.com:80/test//tes.ter/./',
  'http://user:pass@www.domain.com:80/test//tes.ter/',
  'http://user:pass@www.domain.com:80/test//',
  'http://user:pass@www.domain.com:80/test/',
  'http://user:pass@www.domain.com:80/',
  'http://user:pass@www.domain.com:80',
  'http://user:pass@www.domain.com/',
  'http://user:pass@www.domain.com',
  'http://user:pass@www.domain./',
  'http://user:pass@www.domain.',
  'http://user:pass@www.domain/',
  'http://user:pass@www.domain',
  'http://user:pass@www./',
  'http://user:pass@www.',
  'http://user:pass@www/',
  'http://user:pass@www',

  // Parts changing from left to right
  'https://user:pass@www.domain.com:80/test//tes.ter/./../index.html?va r1= +dir&var2=text&var3#anchor',
  'http://user2:pass@www.domain.com:80/test//tes.ter/./../index.html?va r1= +dir&var2=text&var3#anchor',
  'http://user:pass2@www.domain.com:80/test//tes.ter/./../index.html?va r1= +dir&var2=text&var3#anchor',
  'http://user2:pass2@www.domain.com:80/test//tes.ter/./../index.html?va r1= +dir&var2=text&var3#anchor',
  'http://:pass@www.domain.com:80/test//tes.ter/./../index.html?va r1= +dir&var2=text&var3#anchor',
  'http://user:@www.domain.com:80/test//tes.ter/./../index.html?va r1= +dir&var2=text&var3#anchor',
  'http://user@www.domain.com:80/test//tes.ter/./../index.html?va r1= +dir&var2=text&var3#anchor',
  'http://:@www.domain.com:80/test//tes.ter/./../index.html?va r1= +dir&var2=text&var3#anchor',
  'http://@www.domain.com:80/test//tes.ter/./../index.html?va r1= +dir&var2=text&var3#anchor',
  'http://www.domain.com:80/test//tes.ter/./../index.html?va r1= +dir&var2=text&var3#anchor',
  'http://user:pass@www2.domain.com:80/test//tes.ter/./../index.html?va r1= +dir&var2=text&var3#anchor',
  'http://user:pass@domain.com:80/test//tes.ter/./../index.html?va r1= +dir&var2=text&var3#anchor',
  'http://user:pass@www.domain2.com:80/test//tes.ter/./../index.html?va r1= +dir&var2=text&var3#anchor',
  'http://user:pass@www.com:80/test//tes.ter/./../index.html?va r1= +dir&var2=text&var3#anchor',
  'http://user:pass@www.domain.com2:80/test//tes.ter/./../index.html?va r1= +dir&var2=text&var3#anchor',
  'http://user:pass@www.domain:80/test//tes.ter/./../index.html?va r1= +dir&var2=text&var3#anchor',
  'http://user:pass@www.domain.com:81/test//tes.ter/./../index.html?va r1= +dir&var2=text&var3#anchor',
  'http://user:pass@www.domain.com/test//tes.ter/./../index.html?va r1= +dir&var2=text&var3#anchor',
  'http://user:pass@www.domain.com:80/test2//tes.ter/./../index.html?va r1= +dir&var2=text&var3#anchor',
  'http://user:pass@www.domain.com:80/test/tes.ter/./../index.html?va r1= +dir&var2=text&var3#anchor',
  'http://user:pass@www.domain.com:80/test//tes.ter2/./../index.html?va r1= +dir&var2=text&var3#anchor',
  'http://user:pass@www.domain.com:80/test//tes.ter/../index.html?va r1= +dir&var2=text&var3#anchor',
  'http://user:pass@www.domain.com:80/test//tes.ter/./index.html?va r1= +dir&var2=text&var3#anchor',
  'http://user:pass@www.domain.com:80/test//tes.ter/./../index2.html?va r1= +dir&var2=text&var3#anchor',
  'http://user:pass@www.domain.com:80/test//tes.ter/./../?va r1= +dir&var2=text&var3#anchor',
  'http://user:pass@www.domain.com:80/test//tes.ter/./../index.html?va+r1= +dir&var2=text&var3#anchor',
  'http://user:pass@www.domain.com:80/test//tes.ter/./../index.html?va r12= +dir&var2=text&var3#anchor',
  'http://user:pass@www.domain.com:80/test//tes.ter/./../index.html?va r1=++dir&var2=text&var3#anchor',
  'http://user:pass@www.domain.com:80/test//tes.ter/./../index.html?var2=text&var3#anchor',
  'http://user:pass@www.domain.com:80/test//tes.ter/./../index.html?va r1= +dir2&var2=text&var3#anchor',
  'http://user:pass@www.domain.com:80/test//tes.ter/./../index.html?va r1= +dir&var22=text&var3#anchor',
  'http://user:pass@www.domain.com:80/test//tes.ter/./../index.html?va r1= +dir&var3#anchor',
  'http://user:pass@www.domain.com:80/test//tes.ter/./../index.html?va r1= +dir&var2=text2&var3#anchor',
  'http://user:pass@www.domain.com:80/test//tes.ter/./../index.html?va r1= +dir&var2=text&var32#anchor',
  'http://user:pass@www.domain.com:80/test//tes.ter/./../index.html?va r1= +dir&var2=text#anchor',
  'http://user:pass@www.domain.com:80/test//tes.ter/./../index.html?va r1= +dir&var2=text&var3#anchor2',

  // Edge cases
  'http://user:pass@www.domain.com:80/test//tes.ter/./../index.html?va r1= +dir&var2=text&var3&=#anchor',
  'http://user:pass@www.domain.com:80/test//tes.ter/./../index.html?va r1= +dir&var2=text&var2=text2&var3#anchor',
  'http://user:pass@www.domain.com:80/test//tes.ter/./../index.html?var2=text&va r1= +dir&var3&var2=text2#anchor',
  'http://user:pass@www.domain.com:80//',
  'http://user:pass@www.domain.com:80///test/',
  'http://user:pass@com:80/test//tes.ter/./../index.html?va r1= +dir&var2=text&var3#anchor',
  'http://user:pass@localhost:80/test//tes.ter/./../index.html?va r1= +dir&var2=text&var3#anchor',
  'http://user:pass@127.0.0.1:80/test//tes.ter/./../index.html?va r1= +dir&var2=text&var3#anchor',
  'other://domain/',
];

const generate = location => {
  const data = [];

  for (let i = 0; i < urls.length; i++) {
    for (let j = 0; j < urls.length; j++) {
      data.push({
        url1: urls[i],
        url2: urls[j],
        relation: {
          // Placeholder values for manual editing
          careful: null,
          common: null,
        },
      });
    }
  }

  writeFileSync(
    location,
    `${JSON.stringify(data, null, '\t')}\n` // Extra line break for unix/git
  );

  console.log(`Written to: ${location}`);
};

generate(`${import.meta.dirname}/tests.json`);
