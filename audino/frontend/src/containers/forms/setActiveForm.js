import React from 'react';
import { withRouter } from 'react-router';
import { withStore } from '@spyna/react-store';
import { FormAlerts } from '../../components/alert';
import { errorLogger } from '../../logger';
import { Button } from '../../components/button';
import Loader from '../../components/loader';

class SetActiveForm extends React.Component {
  constructor(props) {
    super(props);
    this.onDelete = () => props.onDelete();
    this.initialState = {
     active: null,
     annotate: props.annotate
    };

    this.state = { ...this.initialState };
  }

  handleChange(e) {
    this.setState({ value: e.target.value });
    console.log(e.target.value)
  }

  handleSubmit() {
    console.log("hello?")
    const {value, annotate} =  this.state
    localStorage.setItem("active", value)
    this.setState({
      successMessage: "active has been set to:" + value,
      errorMessage: ''
    });
    annotate.setState({active: value})
    console.log(value)
    this.onDelete();
  }

  handleAlertDismiss(e) {
    e.preventDefault();
    this.setState({
      successMessage: '',
      errorMessage: ''
    });
  }

  render() {
    const { isSubmitting, errorMessage, successMessage, isLoading, isSample, value } = this.state;
    return (
      <div className="container h-75 text-center">
         <FormAlerts
            errorMessage={errorMessage}
            successMessage={successMessage}
            callback={e => this.handleAlertDismiss(e)}
          />
        <text>What audio data do you want recommended to you by clicking next?</text>
        <select class="form-control" onChange={e => this.handleChange(e)}>
          <option value="-1">Choose Active</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="marked_review">Marked review</option>
          <option value="all">All</option>
        </select>
        <text>Go into settings page of side window to change this setting</text>
        <Button type="primary" text="Submit Active" onClick={()=> this.handleSubmit()}/>
      </div>
    );
  }
}

export default withStore(withRouter(SetActiveForm));
