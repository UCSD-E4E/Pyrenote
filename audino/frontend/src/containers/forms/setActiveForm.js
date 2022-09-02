import React from 'react';
import { withRouter } from 'react-router';
import { withStore } from '@spyna/react-store';
import { FormAlerts } from '../../components/alert';
import { Button } from '../../components/button';

/**
 * Form for Annotation page
 * Extra feature: active swap form
 * Allows users to change thier current active mode while annotating
 */
class SetActiveForm extends React.Component {
  /**
   * Set up
   * @param {*} props 
   */
  constructor(props) {
    super(props);
    this.onDelete = () => props.onDelete();
    this.initialState = {
      active: null,
      annotate: props.annotate
    };

    this.state = { ...this.initialState };
  }

  /**
   * Get curerntly selected activate when user changes it
   * @param {*} e 
   */
  handleChange(e) {
    this.setState({ value: e.target.value });
  }

  /**
   * Update the active the uesr is currently on
   * @param {*} e 
   */
  handleSubmit() {
    const { value, annotate } = this.state;
    localStorage.setItem('active', value);
    this.setState({
      successMessage: `active has been set to:${value}`,
      errorMessage: ''
    });
    annotate.setState({ active: value });
    this.onDelete();
  }

  /**
   * Dismiss alerts
   * @param {*} e 
   */
  handleAlertDismiss(e) {
    e.preventDefault();
    this.setState({
      successMessage: '',
      errorMessage: ''
    });
  }

  /**
   * Render the form
   * @returns 
   */
  render() {
    const { errorMessage, successMessage } = this.state;
    return (
      <div className="container h-75 text-center">
        <FormAlerts
          errorMessage={errorMessage}
          successMessage={successMessage}
          callback={e => this.handleAlertDismiss(e)}
        />
        <text>What audio data do you want recommended to you by clicking next?</text>
        <br />
        <select className="form-control" onChange={e => this.handleChange(e)}>
          <option value="-1">Choose Active</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="marked_review">Marked review</option>
          <option value="all">All</option>
          <option value="all">Recommended</option>
        </select>
        <br />
        <text>Go into settings page of side window to change this setting</text>
        <br />
        <Button type="primary" text="Submit Active" onClick={() => this.handleSubmit()} />
      </div>
    );
  }
}

export default withStore(withRouter(SetActiveForm));
