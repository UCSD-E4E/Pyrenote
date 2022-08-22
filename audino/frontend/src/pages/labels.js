import axios from 'axios';
import React from 'react';
import { withRouter } from 'react-router-dom';
import { Helmet } from 'react-helmet';

import { faPlusSquare, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';

import { IconButton } from '../components/button';
import Loader from '../components/loader';
import FormModal from '../containers/modal';

/**
 * Labels react component
 * Displays a table containing data and editing functions for label categories
 * Accessible via labels button from admin portal
 */
class Labels extends React.Component {
  constructor(props) {
    super(props);
    const { match } = this.props;
    const projectId = Number(match.params.id);

    this.state = {
      projectId,
      labels: [],
      formType: null,
      modalShow: false,
      isLabelsLoading: false,
      labelsUrl: `/projects/${projectId}/labels`,
      getLabelsUrl: `/api/projects/${projectId}`
    };
  }

  /**
   * Gets data for label categories if those labels already exist
   */
  componentDidMount() {
    const { getLabelsUrl } = this.state;
    this.setState({ isLabelsLoading: true });

    //get labels from backend here
    axios({
      method: 'get',
      url: getLabelsUrl
    })
      .then(response => {
        //once the backend sends data, set it into state
        this.setState({
          labels: response.data.labels,
          isLabelsLoading: false
        });
      })
      .catch(error => {
        //standard error handling
        console.error(error);
        this.setState({
          isLabelsLoading: false
        });
      });
  }

  /**
   * Handle displaying modal changes to create a new label category
   */
  handleNewLabel() {
    this.setModalShow(true);
    this.setState({
      formType: 'NEW_LABEL',
      title: 'Create New Label Category'
    });
  }

  /**
   * Handle displaying modal for editing label category
   */
  handleEditLabel(e, labelId) {
    this.setModalShow(true);
    this.setState({
      formType: 'EDIT_LABEL',
      title: 'Edit Label Category',
      labelId
    });
  }

  /**
   * Handle displaying modal for deleting label category
   */
  handleDeleteCategory(e, labelId) {
    this.setModalShow(true);
    this.setState({
      formType: 'DELETE_LABEL',
      title: "DELETE LABEL CATEGORY AND ITS LABEL VALUES",
      labelId
    });
  }

  /**
   * wrapper to display modal
   */
  setModalShow(modalShow) {
    this.setState({ modalShow });
  }

  /**
   * Handler to refresh the page with new information
   */
  refreshPage() {
    const { history } = this.props;
    const { labelsUrl } = this.state;
    history.replace({ pathname: '/empty' });
    setTimeout(() => {
      history.replace({ pathname: labelsUrl });
    });
  }

  /**
   * @returns React component containing a table to display and edit labels
   */
  render() {
    const { labels, projectId, labelId, formType, title, modalShow, isLabelsLoading } = this.state;
    return (
      <div>
        {/* title of page */}
        <Helmet>
          <title>Manage Labels</title>
        </Helmet>
        <div className="container h-100">
          {/* render the modal here */}
          <FormModal
            onExited={() => this.refreshPage()}
            formType={formType}
            title={title}
            show={modalShow}
            projectId={projectId}
            labelId={labelId}
            onHide={() => this.setModalShow(false)}
          />
          <div className="h-100 mt-5">
            <div className="row border-bottom my-3">
              {/* Header for title of table and button to add new rows */}
              <div className="col float-left">
                <h1>Labels</h1>
              </div>
              <hr />
              <div className="col float-right">
                <h1 className="text-right">
                  <IconButton
                    icon={faPlusSquare}
                    size="lg"
                    title="Create new label"
                    onClick={e => this.handleNewLabel(e)}
                  />
                </h1>
              </div>

              {/* If there is data to display, display it */}
              {!isLabelsLoading && labels.length > 0 ? (
                <table className="table table-striped">
                  {/* Columns heads */}
                  <thead>
                    <tr>
                      <th scope="col">#</th>
                      <th scope="col">Label Id</th>
                      <th scope="col">Name</th>
                      <th scope="col">Type</th>
                      <th scope="col">Created On</th>
                      <th scope="col">Options</th>
                    </tr>
                  </thead>
                  {/* data rows */}
                  <tbody>
                    {labels.map((label, index) => {
                      return (
                        <tr key={index}>
                          {/* index with 1-indexing */}
                          <th scope="row" className="align-middle">
                            {index + 1}
                          </th>
                          {/* metadata for label */}
                          <td className="align-middle">{label.label_id}</td>
                          <td className="align-middle">{label.name}</td>
                          <td className="align-middle">{label.type}</td>
                          <td className="align-middle">{label.created_on}</td>
                          
                          {/* editing tools for label */}
                          <td className="align-middle">
                            <IconButton
                              icon={faEdit}
                              size="sm"
                              title="Edit label"
                              onClick={e => this.handleEditLabel(e, label.label_id)}
                            />
                            <IconButton
                              icon={faTrash}
                              size="sm"
                              title="Delete label Category"
                              onClick={e => this.handleDeleteCategory(e, label.label_id)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : null}
            </div>
            <div className="row my-4 justify-content-center align-items-center">
              {/* if there is data loading, display laoder */}
              {isLabelsLoading ? <Loader /> : null}
              {/* Otherwise, let the user know they need to add some data! */}
              {!isLabelsLoading && labels.length === 0 ? (
                <div className="font-weight-bold">No labels exist!</div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(Labels);
