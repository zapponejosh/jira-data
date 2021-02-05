const _ = require('lodash');
const csv = require('csv-parser')
const fs = require('fs')

const results = []

fs.createReadStream('jira-prod-250days.csv')
  .pipe(csv())
  .on('data', (data) => 
    {
      const pri = +data.Priority[0]
      const points =  +data['Custom field (Story Points)']
      const sprintCount = () => {
        let count = 0;
        const filteredByKey = Object.fromEntries(Object.entries(data).filter(([key, value]) => key.startsWith("Sprint")))

        for (const [key, value] of Object.entries(filteredByKey)) {
          if (value) {
            count += 1
          }
        }
        return count;
      }

      results.push(
        
        // data
        {
          Title: data.Summary,
          Issue: data['Issue key'],
          Priority: pri,
          Points: points,
          Sprints: sprintCount()

        }
      )
  })
  .on('end', () => {
    console.log(results);
    // [
    //   { NAME: 'Daffy Duck', AGE: '24' },
    //   { NAME: 'Bugs Bunny', AGE: '22' }
    // ]
  });