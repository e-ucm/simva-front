const logger = require('../../logger');
const SimvaAsync  = require('./simvaAsync');

module.exports = {
    async getCompleteGroup(groupid, sessionid) {
        let group=await SimvaAsync.getGroup(groupid, sessionid);
        group.completeParticipants=await SimvaAsync.getGroupParticipants(groupid, sessionid);
        return group;
    }
}