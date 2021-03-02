/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';
import { Voter } from './models/Voter';
import { Ballot } from './models/Ballot';
import { VotableBallot } from './models/VotableBallot';
import { Election } from './models/Election';
import { Candidate } from './models/Candidate';
const path = require('path');
const fs = require('fs');
// connect to the election data file
const electionDataPath = path.join(process.cwd(), './src/data/electionData.json');
const electionDataJson = fs.readFileSync(electionDataPath, 'utf8');
const electionData = JSON.parse(electionDataJson);

// connect to the pres election file
const ballotDataPath = path.join(process.cwd(), './src/data/presElection.json');
const ballotDataJson = fs.readFileSync(ballotDataPath, 'utf8');
const ballotData = JSON.parse(ballotDataJson);



@Info({title: 'VoterContract', description: 'My Smart Contract' })
export class VoterContract extends Contract {

    @Transaction(false)
    @Returns('boolean')
    public async myAssetExists(ctx: Context, voterId: string): Promise<boolean> {
        const data: Uint8Array = await ctx.stub.getState(voterId);
        return (!!data && data.length > 0);
    }

    @Transaction(false)
    @Returns('boolean')
    public async setElection(ctx: Context, electionContext: string) {
      electionContext = JSON.parse(electionContext);
      let election;
      let electionExists = await this.myAssetExists(ctx, electionContext['electionId']);
      if (electionExists) {
        election = new Election(electionContext['electionName'], electionContext['electionCountry'],
        electionContext['electionYear'],electionContext['electionStartDate'], electionContext['electionEndDate']);
        election.status=true;
        await ctx.stub.putState(election.electionId, Buffer.from(JSON.stringify(election)));
    }else{

    }
  }


    @Transaction(false)
    @Returns('boolean')
    public async createElection(ctx: Context, electionContext: string) {
      electionContext = JSON.parse(electionContext);
      let election;
      let elections = [];
        //query for election first before creating one.
        let currElections = JSON.parse(await this.queryByObjectType(ctx, 'election'));
    
     
          election = new Election(electionContext['electionName'], electionContext['electionCountry'],
          electionContext['electionYear'],electionContext['electionStartDate'], electionContext['electionEndDate']);

        election.electionCandidates=electionContext['candidates']
        let electionExists = await this.myAssetExists(ctx, election.electionId);

        if (!electionExists) {
        await ctx.stub.putState(election.electionId, Buffer.from(JSON.stringify(election)));

        let voters = JSON.parse(await this.queryByObjectType(ctx, 'voters'));
        let votableItems = JSON.parse(await this.queryByObjectType(ctx, 'votableItems'));
       //generate ballots for all voters
       for (let i = 0; i < voters.length; i++) {
    
        if (!voters[i].ballot) {
  
          //give each registered voter a ballot
          await this.generateBallot(ctx, votableItems, election, voters[i]);
  
        } else {
          console.log('these voters already have ballots');
          break;
        }
  
      }

        } else {
          let response = {};
          response= `the election or the voter does not exist! ${electionContext['voterId']} ${electionContext['electionId']} `;
          return response;
        }


       
      
    }


    
    
    @Transaction()
    @Returns('voters')
    public async addCandidate(ctx:Context,candidate:string){
      candidate = JSON.parse(candidate);
      let candidateObj= new Candidate(candidate['id'] ,candidate['type'],candidate['politicalParty'], candidate['description'],candidate['imageURL']) 

      await ctx.stub.putState(candidateObj.id, Buffer.from(JSON.stringify(candidateObj)));

    }
 

   
    @Transaction()
    @Returns('voters')
    public async initLedger(ctx: Context) {

        console.log('instantiate was called!');

        let voters = [];
        let votableItems = [];
        let elections = [];
        let election:any;
        let electionCandidate =[];
        //create voters
        let voter1 = new Voter('V1', '234', 'Horea', 'Porutiu');
        let voter2 = new Voter('V2', '345', 'Duncan', 'Conley');
    
        //update voters array
        voters.push(voter1);
        voters.push(voter2);
    
        //add the voters to the world state, the election class checks for registered voters 
        await ctx.stub.putState(voter1.voterId, Buffer.from(JSON.stringify(voter1)));
        await ctx.stub.putState(voter2.voterId, Buffer.from(JSON.stringify(voter2)));
    
        //query for election first before creating one.
        let currElections = JSON.parse(await this.queryByObjectType(ctx, 'election'));
    
        if (currElections.length === 0) {
    
          //Nov 3 is election day
          let electionStartDate = new Date(2020, 11, 3);
          let electionEndDate = new Date(2020, 11, 4);
    
          //create the election
          election = new Election(electionData.electionName, electionData.electionCountry,
              electionData.electionYear, electionStartDate, electionEndDate);
    
          //update elections array
          elections.push(election);
    
          await ctx.stub.putState(election.electionId, Buffer.from(JSON.stringify(election)));
    
        } else {
          election = currElections[0];
        }
    
    
        //create votableItems for the ballots
        let repVotable = new VotableBallot(ctx, 'Republican', ballotData.fedDemocratBrief);
        let demVotable = new VotableBallot(ctx, 'Democrat', ballotData.republicanBrief);
        let indVotable = new VotableBallot(ctx, 'Green', ballotData.greenBrief);
        let grnVotable = new VotableBallot(ctx, 'Independent', ballotData.independentBrief);
        let libVotable = new VotableBallot(ctx, 'Libertarian', ballotData.libertarianBrief);
    
        //populate choices array so that the ballots can have all of these choices 
        votableItems.push(repVotable);
        votableItems.push(demVotable);
        votableItems.push(indVotable);
        votableItems.push(grnVotable);
        votableItems.push(libVotable);
    
        for (let i = 0; i < votableItems.length; i++) {
          await ctx.stub.putState(votableItems[i].votableId, Buffer.from(JSON.stringify(votableItems[i])));

        }
    
        //generate ballots for all voters
        for (let i = 0; i < voters.length; i++) {
    
          if (!voters[i].ballot) {
    
            //give each registered voter a ballot
            await this.generateBallot(ctx, votableItems, election, voters[i]);
    
          } else {
            console.log('these voters already have ballots');
            break;
          }
    
        }
    
        return elections;


    }
    
    @Transaction()
    @Returns('Test')
    public async createVoter(ctx: Context, voterId:string): Promise<Object> {
        voterId = JSON.parse(voterId);
        
        const exists: boolean = await this.myAssetExists(ctx, voterId['id']);
        if (exists) {
            throw new Error(`The voter ${voterId} already exists`);
        } 

        console.log("OKKKKKKKKKKKKKKKKKK")
        const voter: Voter = new Voter(voterId['id'],"hi","lol","ok");
     
        const buffer: Buffer = Buffer.from(JSON.stringify(voter));
        await ctx.stub.putState(voterId['id'], buffer);


            //query state for elections
            let currElections = JSON.parse(await this.queryByObjectType(ctx, 'election'));
            //get the election that is created in the init function
            let currElection = currElections[0];
        
            let votableItems = JSON.parse(await this.queryByObjectType(ctx, 'votableItem'));
            
            //generate ballot with the given votableItems
         
            await this.generateBallot(ctx, votableItems, currElection, voter);

            let response = `voter with voterId ${voter.voterId} is updated in the world state`;
            return response;
          
        
    }
    @Transaction()
    @Returns('Test')
    
    public async queryByObjectType(ctx:Context, objectType:string) {

        let queryString = {
          selector: {
            type: objectType
          }
        };
    
        let queryResults = await this.queryWithQueryString(ctx, JSON.stringify(queryString));
        return queryResults;
    
      }

      
      public async generateBallot(ctx:Context, votableItems:any, election:Election, voter:Voter) {

        //generate ballot
        let ballot = new Ballot(ctx, votableItems, election, voter.voterId);
        
        //set reference to voters ballot
        voter['ballot'] = ballot.ballotId;
        voter['ballotCreated'] = true;
    
        // //update state with ballot object we just created
        await ctx.stub.putState(ballot.ballotId, Buffer.from(JSON.stringify(ballot)));
    
        await ctx.stub.putState(voter.voterId, Buffer.from(JSON.stringify(voter)));
    
      }
    
     public async queryWithQueryString(ctx:Context, queryString:any) {

        console.log('query String');
        console.log(JSON.stringify(queryString));
    
        let resultsIterator = await ctx.stub.getQueryResult(queryString);
    
        let allResults = [];
    
        // eslint-disable-next-line no-constant-condition
        while (true) {
          let res = await resultsIterator.next();
    
          if (res.value && res.value.value.toString()) {
            let jsonRes = {};
    
            console.log(res.value.value.toString());
    
            jsonRes['Key']= res.value.key;
    
            try {
              jsonRes['Record']= JSON.parse(res.value.value.toString());
            } catch (err) {
              console.log(err);
              jsonRes['Record']= res.value.value.toString();
            }
    
            allResults.push(jsonRes);
          }
          if (res.done) {
            console.log('end of data');
            await resultsIterator.close();
            console.info(allResults);
            console.log(JSON.stringify(allResults));
            return JSON.stringify(allResults);
          }
        }
      }

    @Transaction(false)
    @Returns('Voter')
    public async readVoter(ctx: Context, voterId: string): Promise<Voter> {
        const exists: boolean = await this.myAssetExists(ctx, voterId);
        if (!exists) {
            throw new Error(`The voter ${voterId} does not exist`);
        }
        const data: Uint8Array = await ctx.stub.getState(voterId);
        const voter: Voter = JSON.parse(data.toString()) as Voter;
        return voter;
    }

    @Transaction()
    public async updateAsset(ctx: Context, voterId: string, newValue: string): Promise<void> {
        const exists: boolean = await this.myAssetExists(ctx, voterId);
        if (!exists) {
            throw new Error(`The voter ${voterId} does not exist`);
        }
      
        const voter: Voter = new Voter(voterId,"hi","lol","ok");
        const buffer: Buffer = Buffer.from(JSON.stringify(voter));
        await ctx.stub.putState(voterId, buffer);
    }

    @Transaction()
    public async deleteVoter(ctx: Context, voterId: string): Promise<void> {
        const exists: boolean = await this.myAssetExists(ctx, voterId);
        if (!exists) {
            throw new Error(`The voter ${voterId} does not exist`);
        }
        await ctx.stub.deleteState(voterId);
    }


    /**
   *
   * castVote
   * 
   * First to checks that a particular voterId has not voted before, and then 
   * checks if it is a valid election time, and if it is, we increment the 
   * count of the political party that was picked by the voter and update 
   * the world state. 
   * 
   * @param electionId - the electionId of the election we want to vote in
   * @param voterId - the voterId of the voter that wants to vote
   * @param votableId - the Id of the candidate the voter has selected.
   * @returns an array which has the winning briefs of the ballot. 
   */
      
  @Transaction()
  @Returns('Test')
  public async castVote(ctx:Context, args:string) {
    let err:string;
    args = JSON.parse(args);

    //get the political party the voter voted for, also the key
    let votableId = args['picked'];

    //check to make sure the election exists
    let electionExists = await this.myAssetExists(ctx, args['electionId']);
   

    if (electionExists) {

      //make sure we have an election
      let electionAsBytes = await ctx.stub.getState(args['electionId']);

      let election = await JSON.parse(electionAsBytes.toString());
      let voterAsBytes = await ctx.stub.getState(args['voterId']);
      let voter = await JSON.parse(voterAsBytes.toString());

      if (voter.ballotCast) {
        let response = {};
        response = 'this voter has already cast this ballot!';
        return response;
      }

      //check the date of the election, to make sure the election is still open

      let date: Date = new Date(2020, 11, 3);
      //parse date objects
      let parsedCurrentTime = await Date.parse("2020-11-03T00:00:00.000Z");
      let electionStart = await Date.parse(election.startDate);
      let electionEnd = await Date.parse(election.endDate);

      //only allow vote if the election has started 
      if (parsedCurrentTime >= electionStart && parsedCurrentTime < electionEnd && election.status) {

        let votableExists = await this.myAssetExists(ctx, votableId);
        if (!votableExists) {
          let response = {};
          response = 'VotableId does not exist!';
          return response;
        }

        //get the votable object from the state - with the votableId the user picked
        let votableAsBytes = await ctx.stub.getState(votableId);
        let votable = await JSON.parse(votableAsBytes.toString());

        //increase the vote of the political party that was picked by the voter
         votable.count++;

        //update the state with the new vote count
        let result = await ctx.stub.putState(votableId, Buffer.from(JSON.stringify(votable)));
        console.log(result);

        //make sure this voter cannot vote again! 
        voter.ballotCast = true;
        voter.picked = {};
        voter.picked = args['picked'];

        //update state to say that this voter has voted, and who they picked
        let response = await ctx.stub.putState(voter.voterId, Buffer.from(JSON.stringify(voter)));
        console.log(response);
        return voter;

      } else {
        let response = {};
        response = `the election is not open now! ${date.toDateString()}  ${election.startDate}  ${election.endDate} `;
        return response;
      }

    } else {
      let response = {};
      response= `the election or the voter does not exist! ${args['voterId']} ${args['electionId']} `;
      return response;
    }
  }

 /**
   * Query and return all key value pairs in the world state.
   *
   * @param {Context} ctx the transaction context
   * @returns - all key-value pairs in the world state
  */
 @Transaction()
 @Returns('Test')
 public async queryAll(ctx:Context) {

    let queryString = {
      selector: {}
    };

    let queryResults = await this.queryWithQueryString(ctx, JSON.stringify(queryString));
    return queryResults;

  }
}
