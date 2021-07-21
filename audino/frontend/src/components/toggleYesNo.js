
import React from 'react';

import { withStore } from '@spyna/react-store';
import { Button } from './button';
class ToggleYesNo extends React.Component {
  constructor() {
    super()
    this.state = {
      "yes": false,
      "no": false,
    }
  }
  handleClick(type) {
    const {yes, no} = this.state
    if (type === "yes") this.setState({yes: true, no: false})
    if (type === "no") this.setState({yes: false, no: true})
  }
  
  render() {
    const {yes, no} = this.state
    return(
      <div>
      <text> <b>Feeling Confident In your labels?</b></text>
        <div className="row justify-content-center my-4">
        
          <div className="col-4">
            <Button
              text="Yes"
              size="lg"
              type={yes ? "primary" : "danger"}
              onClick={() => this.handleClick("yes")}
            />
          </div>
          {/*<div className="col-4">
            <Button
              text="&nbsp;"
              size="lg"
              type="primary"
              onClick={() => {}}
            />
          </div>*/}
          <div className="col-4">
            <Button
              text="No"
              size="lg"
              type={no ? "primary" : "danger"}
              onClick={() => this.handleClick("no")}
            />
          </div>
        </div>
      </div>
    )
  }
}


export default ToggleYesNo;
