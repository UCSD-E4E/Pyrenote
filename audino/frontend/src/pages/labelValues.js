import axios from 'axios';
import React from 'react';
import { withRouter } from 'react-router-dom';
// import { Helmet } from 'react-helmet';
import { withStore } from '@spyna/react-store';
import { faPlusSquare, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';

import { IconButton } from '../components/button';
import Loader from '../components/loader';
import FormModal from '../containers/modal.js';


/**
 * LabelValues
 * Admin Page
 * Displays the diffrent label values that are possible selections
 * For that spefified label category
 * 
 * Unlike other forms, this is is own webpage accessible via admin protal -> labels categories -> label values. 
 */
class LabelValues extends React.Component {
  constructor(props) {
    super(props);
    const { id } = this.props;
    const labelId = Number(id);
    this.state = {
      labelId,
      labelValues: [],
      formType: null,
      modalShow: false,
      isLabelValuesLoading: false,
      getLabelValuesUrl: `/api/labels/${labelId}/values`
    };
  }

  /**
   * Starting method, runs when the component runs for the frist time
   * For this case: if there are already label values create for that label category,
   * pull those label values from the backend so the admins can see them
   */
  componentDidMount() {
    const { getLabelValuesUrl } = this.state;
    this.setState({ isLabelValuesLoading: true });

    axios({
      method: 'get',
      url: getLabelValuesUrl
    })
      .then(response => {
        this.setState({
          labelValues: response.data.values,
          isLabelValuesLoading: false
        });
      })
      .catch(error => {
        console.error(error);
        this.setState({
          isLabelValuesLoading: false
        });
      });
  }

  /**
   * If we want to create a new label values, pull up the
   * create label values modal
   */
  handleNewLabelValues() {
    this.setModalShow(true);
    this.setState({
      formType: 'NEW_LABEL_VALUE',
      title: 'Create New Label Value'
    });
  }

  /**
   * If we want to edit a label value, pull up the
   * edit label values modal
   * @param {*} e 
   * @param {*} labelId ID of label category
   * @param {*} labelValueId ID of label value to edit
   */
  handleEditLabelValue(e, labelId, labelValueId) {
    this.setModalShow(true);
    this.setState({
      formType: 'EDIT_LABEL_VALUE',
      title: 'Edit Label Value',
      labelId,
      labelValueId
    });
  }

  /**
   * If we want to edit a label value, pull up the
   * delete label values modal
   * @param {*} e 
   * @param {*} labelId ID of label category
   * @param {*} labelValueId ID of label value to delete
   */
  handleDeleteLabel(e, labelId, labelValueId) {
    this.setModalShow(true);
    this.setState({
      formType: 'DELETE_LABEL_VALUE',
      title: 'Delete Label Value',
      labelId,
      labelValueId
    });
  }

  /**
   * Wrapper for letting the state know if a modal is displayed or not
   * @param {*} modalShow 
   */
  setModalShow(modalShow) {
    this.setState({ modalShow });
  }

  /**
   * Reset the label values by recalling the setup function
   */
  refreshPage() {
    this.componentDidMount();
  }

  /**
   * @returns React Component for Displaying, deleting, editing, and creating label values for a spefific
   * label category
   */
  render() {
    const { labelValues, labelId, labelValueId, formType, title, modalShow, isLabelValuesLoading } =
      this.state;
    return (
      <div>
        <div className="container h-100">
          {/* Set up Generic Modal For editing, delting, and creating label values */}
          <FormModal
            onExited={() => this.refreshPage()}
            formType={formType}
            title={title}
            show={modalShow}
            labelId={labelId}
            labelValueId={labelValueId}
            onHide={() => this.setModalShow(false)}
          />

          {/* Table to dispaly label values that exist already */}
          <div className="h-100 mt-5">
            <div className="row border-bottom my-3">
              <hr />
              {/* Header that contains button for creating labels */}
              <div className="float-right">
                <h1 className="text-right">
                  <IconButton
                    icon={faPlusSquare}
                    size="lg"
                    title="Create new label"
                    onClick={e => this.handleNewLabelValues(e)}
                  />
                </h1>
              </div>
              {/* 
                Rows of tables to display 
                - if there is data, display the data
                - Else show a genertic loader symbol
              */}
              {!isLabelValuesLoading && labelValues.length > 0 ? (
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th scope="col">#</th>
                      <th scope="col">Label Value Id</th>
                      <th scope="col">Value</th>
                      <th scope="col">Created On</th>
                      <th scope="col">Options</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Each row contains metadata for label values and buttons for editing and deleting */}
                    {labelValues.map((labelValue, index) => {
                      return (
                        <tr key={index}>
                          <th scope="row" className="align-middle">
                            {index + 1}
                          </th>
                          <td className="align-middle">{labelValue.value_id}</td>
                          <td className="align-middle">{labelValue.value}</td>
                          <td className="align-middle">{labelValue.created_on}</td>
                          <td className="align-middle">
                            <IconButton
                              icon={faEdit}
                              size="sm"
                              title="Edit label value"
                              onClick={e =>
                                this.handleEditLabelValue(e, labelId, labelValue.value_id)
                              }
                            />
                            <IconButton
                              icon={faTrash}
                              size="sm"
                              title="Delete label"
                              onClick={e => this.handleDeleteLabel(e, labelId, labelValue.value_id)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : null}
            </div>
            {
              /* while data loads, show a loader, 
                otherwise the data may not exist. 
                Better let the user know!! */
            }
            <div className="row my-4 justify-content-center align-items-center">
              {isLabelValuesLoading ? <Loader /> : null}
              {!isLabelValuesLoading && labelValues.length === 0 ? (
                <div className="font-weight-bold">No label values exist!</div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withStore(withRouter(LabelValues));
