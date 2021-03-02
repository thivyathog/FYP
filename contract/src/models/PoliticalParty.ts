
'use strict';
export class PoliticalParty {

    id:string; 
    
    politicalPartyName:string ;
    ismember:boolean=false;
    description :any;
    type:any;
   
    __isContract:any;


  constructor(id:string ,type:any, politicalPartyName:string, description:string) {

      this.ismember=true;
      this.id = id;
     this.type=type;
      this.politicalPartyName = politicalPartyName;
      this.description = description;
      
      if (this.__isContract) {
        delete this.__isContract;
      }
      
      return this;


  }

  /**
   *
   * validateVoter
   *
   * check for valid ID card - stateID or drivers License.
   *  
   * @param voterId - an array of choices 
   * @returns - yes if valid Voter, no if invalid
   */
  async validateVoter(voterId) {
    //VoterId error checking here, i.e. check if valid drivers License, or state ID
    if (voterId) {
      return true;
    } else {
      return false;
    }
  }

  /**
   *
   * validateRegistrar
   *
   * check for valid registrarId, should be cross checked with government
   *  
   * @param voterId - an array of choices 
   * @returns - yes if valid Voter, no if invalid
   */
  async validateRegistrar(registrarId) {

    //registrarId error checking here, i.e. check if valid drivers License, or state ID
    if (registrarId) {
      return true;
    } else {
      return false;
    }
  }

}
