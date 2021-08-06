
import React from 'react';
import axios from 'axios';
import { withStore } from '@spyna/react-store';
import { Button } from '../button';
class ToggleYesNo extends React.Component {
  constructor(params) {
    super(params)
    this.projectID = params.projectID
    this.dataID = params.dataID
    this.state = {
      "yes": false,
      "no": false,
    }
  }
  handleClick(type) {
    let newState = null
    if (type === "yes") newState = {yes: true, no: false}
    if (type === "no") newState = {yes: false, no: true}
    this.setState(newState)
    let url = "/api/projects/" +this.projectID + "/data/" + this.dataID +
           "/confident_check"
    axios({
      method: 'POST',
      url,
      data: {
        confidentCheck: newState.yes
      }
    })
  }
  
  render() {
    const {yes, no} = this.state
    let msg = ": "
    if (yes) msg = ": yes"
    else msg = ": no"
    return(
      <Button
        text={"Feeling Confident In \n your labels?" + msg}
        size="sm"
        type={yes ? "primary" : "danger"}
        onClick={() => this.handleClick(yes? "no" : "yes")}
      />
    )
  }
}


export default ToggleYesNo;
