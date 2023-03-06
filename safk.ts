
import {
    ApproveVote as ApproveVoteEvent,
    CharityApproved as CharityApprovedEvent,
    CharityCreated as CharityCreatedEvent,
    CharityDisapproved as CharityDisapprovedEvent,
    DisapproveVote as DisapproveVoteEvent
  } from "../generated/ValidateCharities/ValidateCharities"
  import {
    CharityApproved,
    CharityCreated,
  
  } from "../generated/schema"
  
  
  export function handleCharityApproved(event: CharityApprovedEvent): void {
    let charity = CharityApproved.load(event.transaction.hash.concatI32(event.params.charityId.toI32()))
  
    if (!charity){
      charity = new CharityApproved(
      event.transaction.hash.concatI32(event.params.charityId.toI32())
      )
      charity.charityId = event.params.charityId
      charity.charityAddress = event.params.charityAddress
      charity.name = event.params.name
  
      charity.blockNumber = event.block.number
      charity.blockTimestamp = event.block.timestamp
      charity.transactionHash = event.transaction.hash
    }
  
    charity.save()
  }
  
  export function handleCharityCreated(event: CharityCreatedEvent): void {
    let charity = new CharityCreated(
      event.transaction.hash.concatI32(event.logIndex.toI32())
    )
    charity.charityAddress = event.params.charityAddress
    charity.name = event.params.name
    charity.charityId = event.params.charityId
    charity.info = event.params.info
  
    charity.blockNumber = event.block.number
    charity.blockTimestamp = event.block.timestamp
    charity.transactionHash = event.transaction.hash
  
    charity.save()
  }
  
  
  
  