/**
 * Handles rendering the admin portal of the website
 */

import axios from 'axios';
import React from 'react';
import { withRouter } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { faPlusSquare, faTrash, faTrashRestore, faUndo, faMinusCircle } from '@fortawesome/free-solid-svg-icons';
import { IconButton } from '../components/button';
import Loader from '../components/loader';
import FormModal from '../containers/modal';
import { AdminHandleFormProjects, AdminHandleFormUsers } from './adminHandleForm';

const Admin = props => {
  //InitModal state for all project metadata needed to pass into modals
  const initModal = {
    formType: null,
    modalShow: false,
    title: null,
    userId: null,
    projectId: null,
    projectName: null,
    api_key: null, 
    projectsToDelete: null,
    projectsToRecover: null,
    clearProjectsToDelete: null,
    clearProjectsToRecover: null
  };
  const [modalState, setModalState] = React.useState(initModal);


  //InitModal state for all project metadata needed to pass into modals
  const initUser = {
    users: [],
    isUserLoading: false
  };
  const [userState, setUserState] = React.useState(initUser);


  //init list of projects/
  const initProject = {
    projects: [],
    isProjectLoading: false
  };
  const [projectState, setProjectState] = React.useState(initProject);

  //init list of selected projects
  const initAllProjectSelected = false;
  const [allProjectSelected, setAllProjectSelected] = React.useState(initAllProjectSelected);

  //init list of deleted projects that are selected
  const initAllDeletedProjectSelected = false;
  const [allDeletedProjectSelected, setAllDeletedProjectSelected] = React.useState(initAllDeletedProjectSelected);

  //init list of projects selected for deletion
  const initProjectsToDelete = [];
  const [projectsToDelete, setProjectsToDelete] = React.useState(initProjectsToDelete);

  //init list of deleted projects selected for recovery
  const initProjectsToRecover = [];
  const [projectsToRecover, setProjectsToRecover] = React.useState(initProjectsToRecover);

  //handler to show deleted projects or not
  const initShowDeletedProjects = false;
  const [showDeletedProjects, setShowDeletedProjects] = React.useState(initShowDeletedProjects);

  /**
   * Get all the metadata for all projects
   * that are not deleted
   * 
   * Save that metadata to project states
   */
  const fetchProjects = () => {
    axios({
      method: 'get',
      url: '/api/projects'
    })
      .then(response => {
        setProjectState({
          ...projectState,
          projects: response.data.projects,
          isProjectLoading: false
        });
      })
      .catch(() => {
        setProjectState({
          ...projectState,
          isProjectLoading: false
        });
      });
  };

  /**
   * Get all the metadata for all projects
   * that ARE deleted
   * 
   * Save that metadata to project states
   */
  const fetchDeletedProjects = () => {
    axios({
      method: 'get',
      url: '/api/projects/get_deleted_projects'
    })
      .then(response => {
        setProjectState({
          ...projectState,
          projects:response.data.projects,
          isProjectLoading: false
        });
      })
      .catch(() => {
        setProjectState({
          ...projectState,
        isProjectLoading: false
        });
      });
  };

  /**
   * Get all the metadata for all users
   */
  const fetchUsers = () => {
    axios({
      method: 'get',
      url: '/api/users'
    })
      .then(response => {
        setUserState({
          ...userState,
          users: response.data.users,
          isUserLoading: false
        });
      })
      .catch(() => {
        setUserState({
          ...userState,
          isUserLoading: false
        });
      });
  };

  /**
   * When loading the webpage for the frist time, fetch all metadata
   */
  React.useEffect(() => {
    fetchProjects();
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Handler to show modal
   * @param {*} newState 
   */
  const showModal = newState => {
    setModalState({ ...modalState, ...newState, modalShow: true });
  };

  /**
   * Handler to show new user creation modal
   */
  const handleNewUser = () => {
    showModal({ formType: 'NEW_USER', title: 'Create New User' });
  };

  /**
   * Handler to show new project creation modal
   */
  const handleNewProject = () => {
    showModal({ formType: 'NEW_PROJECT', title: 'Create New Project' });
  };

  /**
   * Handler to show delete project modal
   */
  const deleteProject = () => {
    showModal({formType: 'DELETE_PROJECT', title: 'Delete Project', projectsToDelete: projectsToDelete});
  }

  /**
   * Handler to show recover project modal
   */
  const recoverProject = () => {
    showModal({formType: 'RECOVER_PROJECT', title: 'Recover Project', projectsToRecover: projectsToRecover});
  }

  /**
   * Update page
   * This updated deleted and recovered project lists
   * and deleted and created users
   */
  const updatePage = () => {
    //To update, reset all states to init
    //TODO: Consider just appending new states to og states rather than a full refresh on the admin
    //portal
    console.log("update page");
    setModalState({ ...modalState, modalShow: false });
    setModalState(initModal);
    setProjectState(initProject);
    setUserState(initUser);
    
    //Fetch user metadata
    fetchUsers();

    //depending on if we are looking at the trash or main list, fetch project data
    if (showDeletedProjects) {
      fetchDeletedProjects();
    } else {
      fetchProjects();
    }
  };

  /**
   * Wipes all selected projects to delete
   */
  const clearProjectsToDelete = () => {
    setProjectsToDelete([]);
    setAllProjectSelected(false);
  }

  /**
   * Wipes all selected projects to Recover
   */
  const clearProjectsToRecover = () => {
    setProjectsToRecover([]);
    setAllDeletedProjectSelected(false);
  }

  /**
   * Render the admin portal
   */
  return (
    <div>
      <Helmet>
        <title>Admin Panel</title>
      </Helmet>
      <div className="container h-100">
        {/** This modal handles all possible pop ups for editing project and user info */}
        <FormModal
          onExited={() => updatePage()}
          formType={modalState.formType}
          title={modalState.title}
          show={modalState.modalShow}
          userId={modalState.userId}
          projectId={modalState.projectId}
          projectName={modalState.projectName}
          projectsToDelete={projectsToDelete}
          projectsToRecover={projectsToRecover}
          clearProjectsToDelete={() => clearProjectsToDelete()}
          clearProjectsToRecover={() => clearProjectsToRecover()}
          api_key={modalState.api_key}
          onHide={() => setModalState({ ...modalState, modalShow: false })}
        />

         {/** RENDER PROJECT LIST */}
        <div className="h-100 mt-5">
          <div className="row border-bottom my-3">
            <div className="col float-left">
              <h1>
                Projects 
                  {
                    showDeletedProjects
                      ? <span className='deletedProjectTextIcon'>REMOVED</span>
                      : <span className='currentProjectTextIcon'>CURRENT</span>
                  }
              </h1>
              
            </div>
            <hr />
            <div className="col float-right">
              {/** RENDER GENERAL PROJECT EDITING BUTTONS*/}
              {!showDeletedProjects
                ? <h1 className="text-right">
                    <IconButton
                      icon={faPlusSquare}
                      size="lg"
                      title="Create new project"
                      onClick={e => handleNewProject(e)}
                    />
                    <IconButton
                      icon={faMinusCircle}
                      size="lg"
                      style={{"color": "red"}}
                      title="Remove project"
                      onClick={(e) => {
                        if (projectsToDelete.length > 0) {
                          deleteProject(e);
                        } else {
                          window.alert("Please select AT LEAST (1) project to remove.");
                        }
                      }}
                      />
                    <IconButton
                      icon={faTrash}
                      size="lg"
                      title="Show removed projects"
                      onClick={(e) => {
                        setShowDeletedProjects(true);
                        fetchDeletedProjects();
                      }}
                    />
                  </h1>
                : <h1 className="text-right">
                    <IconButton 
                      icon={faUndo}
                      size="lg"
                      title="Recover project"
                      style={{"color":"green"}}
                      onClick={(e) => {
                        if (projectsToRecover.length > 0) {
                          recoverProject(e);
                        } else {
                          window.alert("Please select AT LEAST (1) project to recover")
                        }
                      }}
                      />
                    <IconButton
                      icon={faTrashRestore}
                      size="lg"
                      title="Show current projects"
                      onClick={(e) => {
                        setShowDeletedProjects(false);
                        fetchProjects();
                      }}
                    />
                  </h1>
              }
            </div>
            {/** RENDER PROJECT SPEFIFIC ROWS */}
            {!projectState.isProjectLoading && projectState.projects.length > 0 ? (
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th scope="col">
                      {!showDeletedProjects
                        ? <input
                            type="checkbox"
                            checked={allProjectSelected}
                            onChange={() => {
                              console.log(projectsToDelete);
                              if (!allProjectSelected) {
                                setProjectsToDelete(projectState.projects.map(project => project.project_id));
                                setAllProjectSelected(true);
                              } else {
                                  setAllProjectSelected(false);
                                  setProjectsToDelete([]);
                              }
                            }} 
                        />
                        : <input
                            type="checkbox"
                            checked={allDeletedProjectSelected}
                            onChange={() => {
                              console.log(projectsToRecover);
                              if (!allDeletedProjectSelected) {
                                setProjectsToRecover(projectState.projects.map(project => project.project_id));
                                setAllDeletedProjectSelected(true);
                              } else {
                                  setAllDeletedProjectSelected(false);
                                  setProjectsToRecover([]);
                              }
                            }} 
                          />
                      }
                    </th>
                    <th scope="col">ID</th>
                    <th scope="col">Name</th>
                    <th scope="col">Created By</th>
                    <th scope="col">API Key</th>
                    <th scope="col">Options</th>
                  </tr>
                </thead>
                <tbody>
                  {projectState.projects.map((project, index) => (
                    <tr key={project.project_id}>
                      <th scope="row" className="align-middle">
                        {!showDeletedProjects 
                          ? <input 
                              type="checkbox"
                              checked={projectsToDelete.includes(project.project_id)}
                              onChange={() => {
                                console.log(projectsToDelete);
                                if (!projectsToDelete.includes(project.project_id)) {
                                  setProjectsToDelete([...projectsToDelete, project.project_id]);
                                  if (projectsToDelete.length + 1 === projectState.projects.length) {
                                    setAllProjectSelected(true);
                                  }
                                } else {
                                    if (projectsToDelete.length === projectState.projects.length) {
                                      setAllProjectSelected(false);
                                    }
                                    setProjectsToDelete(projectsToDelete.filter(projectId => projectId !== project.project_id));
                                }
                              }}
                            />
                          : <input 
                              type="checkbox"
                              checked={projectsToRecover.includes(project.project_id)}
                              onChange={() => {
                                console.log(projectsToRecover);
                                if (!projectsToRecover.includes(project.project_id)) {
                                  setProjectsToRecover([...projectsToRecover, project.project_id]);
                                  if (projectsToRecover.length + 1 === projectState.projects.length) {
                                    setAllDeletedProjectSelected(true);
                                  }
                                } else {
                                    if (projectsToRecover.length === projectState.projects.length) {
                                      setAllDeletedProjectSelected(false);
                                    }
                                    setProjectsToRecover(projectsToRecover.filter(projectId => projectId !== project.project_id));
                                }
                              }}
                            />
                        }
                        
                      </th>
                      <th scope="row" className="align-middle">
                        {project.project_id}
                      </th>
                      <td className="align-middle">{project.name}</td>
                      <td className="align-middle">{project.created_by}</td>
                      <td className="align-middle">{project.api_key}</td>
                      <AdminHandleFormProjects
                        showDeletedProjects={showDeletedProjects}
                        showModal={showModal}
                        adminProps={props}
                        project={project}
                      />
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </div>
          <div className="row my-4 justify-content-center align-items-center">
            {projectState.isProjectLoading ? <Loader /> : null}
            {!projectState.isProjectLoading && projectState.projects.length === 0 ? (
              <div className="font-weight-bold">No projects exists!</div>
            ) : null}
          </div>

          {/** RENDER USER TABLE */}
          <div className="row mt-2">
            <div className="col float-left">
              <h1>Users</h1>
            </div>
            <div className="col float-right">
              <h1 className="text-right">
                <IconButton
                  icon={faPlusSquare}
                  size="lg"
                  title="Create new user"
                  onClick={e => handleNewUser(e)}
                />
              </h1>
            </div>
            {!userState.isUserLoading && userState.users.length > 0 ? (
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Username</th>
                    <th scope="col">Role</th>
                    <th scope="col">Created On</th>
                    <th scope="col">Options</th>
                  </tr>
                </thead>
                <tbody>
                  {userState.users.map((user, index) => (
                    <tr key={index}>
                      <th scope="row" className="align-middle">
                        {index + 1}
                      </th>
                      <td className="align-middle">{user.username}</td>
                      <td className="align-middle">{user.role}</td>
                      <td className="align-middle">{user.created_on}</td>
                      <AdminHandleFormUsers showModal={showModal} user={user} />
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </div>
          <div className="row my-4 justify-content-center align-items-center">
            {userState.isUserLoading ? <Loader /> : null}
            {!userState.isUserLoading && userState.users.length === 0 ? (
              <div className="font-weight-bold">No user exists!</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default withRouter(Admin);
