const _ = require('lodash');
const csv = require('csv-parser')
const fs = require('fs');
const { strict } = require('assert');

const results = []

fs.createReadStream('jira-prod-250days.csv')
  .pipe(csv())
  // .on('headers', (headers) => )
  .on('data', (data) => 
    {

      const filteredByKey = (str) => Object.fromEntries(Object.entries(data).filter(([key, value]) => key.startsWith(str)))


      const pri = +data.Priority[0]
      const points =  +data['Custom field (Story Points)']
      const sprintCount = () => {
        let count = 0;
        const filteredSprint = filteredByKey("Sprint")

        for (const [key, value] of Object.entries(filteredSprint)) {
          if (value) {
            count += 1
          }
        }
        return count;
      }

      const findStageDate = () => {
        const filteredComments = filteredByKey("Comment")
        for (const [key, value] of Object.entries(filteredComments)) {
          if (value.includes("staged")) {
            return new Date(value.slice(0,10))
            
          }
        }
      }
      // const findCompleteDate = () => {
      //   const filteredComments = filteredByKey("Comment")
      //   for (const [key, value] of Object.entries(filteredComments)) {
      //     if (value.includes("publish")) {
      //       return new Date(value.slice(0,10))
            
      //     }
      //   }
      // }
      
      const obj = {
        Title: data.Summary,
        Issue: data['Issue key'],
        Priority: pri,
        Points: points,
        Sprints: sprintCount(),
        DateCreated: new Date(data.Created),
        StagedDate: findStageDate(),
        TillStaged: Math.floor((findStageDate() - new Date(data.Created)) / (1000 * 60 * 60 * 24)),
        DateResolved: new Date(data.Resolved),
        StagedToClose:  Math.floor((new Date(data.Resolved) - findStageDate()) / (1000 * 60 * 60 * 24))

      }

      if (obj.StagedDate) {
        results.push(
          // data
          obj
        )
      }

      
  })
  .on('end', () => {
    // console.log(results);
    let totalHighPoints = 0
    let highCount = 0
    let totalLowPoints = 0
    let lowCount = 0
    let removeOutliers = 0
    let totalOut = 0
    const stagedToCloseArr = []
    
    // sort array
    results.sort(function(a, b) {
      return a.StagedToClose - b.StagedToClose;
    })


    results.forEach((obj, idx) => {

      stagedToCloseArr.push(+obj.StagedToClose)

      if (obj.Points >=4) {
        totalHighPoints += obj.StagedToClose
        highCount += 1
      } else {
        totalLowPoints += obj.StagedToClose
        lowCount += 1
      }

      if (idx >= 19 && idx <= results.length - 21) {
        removeOutliers += obj.StagedToClose
        totalOut += 1
      }
    })

    const output = {
      maxLength: "Max staging legnth = " + results[results.length -1].StagedToClose,
      overall: "Overall average: " + (((totalHighPoints+totalLowPoints)/results.length).toFixed(3)) + " days out of " + results.length + " tickets",
      median: results[Math.floor(results.length / 2)].StagedToClose + " days staged to close",
      highPointed: "High pointed tickets (4 or more): " + (totalHighPoints/highCount).toFixed(3) + " days out of " + highCount + " tickets",
      lowPointed: "Low pointed tickets (less than 4): " + (totalLowPoints/lowCount).toFixed(3) + " days out of " + lowCount + " tickets",
      removed20: "Remove top and bottom 20 results: " + (removeOutliers/totalOut).toFixed(3) + " days out of " + totalOut + " tickets",
      twentyLongestTickets: results.slice(-20)

    }
  
    fs.writeFile('output.json', JSON.stringify(output, null, 2), (err) => {
      if (err) throw err;
      console.log('The file has been saved!');
    });


    // console.log(results.slice(-20))
    // console.log("Max staging legnth = " + results[results.length -1].StagedToClose)
    // console.log("Overall average: " + (((totalHighPoints+totalLowPoints)/results.length).toFixed(3)) + " days out of " + results.length + " tickets")
    // console.log("High pointed tickets (4 or more): " + (totalHighPoints/highCount).toFixed(3) + " out of " + highCount + " tickets")
    // console.log("Low pointed tickets (less than 4): " + (totalLowPoints/lowCount).toFixed(3) + " out of " + lowCount + " tickets")

  });