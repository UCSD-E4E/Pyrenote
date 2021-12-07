

// Not certain about yet
import React from 'react';
import { withRouter } from 'react-router-dom';
import { Helmet } from 'react-helmet';
// Needed
import { Button } from '../components/button';

const Profile = props => {

  return (
    <div>
      <Helmet>
        <title>Profile Page</title>
      </Helmet>
      
      <div className="container h-100 mt-5">
        <h1>My Profile</h1> <br></br>
        
        {/* Intial Data in Rows */}
        <p><b>User Name: </b> Dylan Nelson</p>
        <p><b>Team: </b> DSC 180a</p>
        <p><b>Expected Completion: </b> 12/1/2021</p>

        {/* Table with General Annotation Info */}
        <table className="table table-striped">
          <thead>
            <tr>
              {/* Table Column Names */}
              <th scope="col"><b>Annotations</b></th>
              <th scope="col">Files Annotated</th>
              <th scope="col">Annotations Expected</th>
              <th scope="col">% Completed</th>
              <th scope="col">&nbsp;</th>
            </tr>
          </thead>
          <tbody>
            <tr>
                {/* Table Data */}
                <th scope="row" className="align-middle"></th>
                <td className="align-middle">47</td>
                <td className="align-middle">150</td>
                <td className="align-middle">12.55%</td>
                <td className="align-middle">
                  <Button size="lg" type="primary" text="Start" />
                </td>
            </tr>
  
          </tbody>
        </table><br></br>
        

        {/* Table with SPECIFIC Annotation Info */}
        <table className="table table-striped">
          <thead>
            <tr>
              {/* Table Column Names */}
              <th scope="col"><b>Annotation History</b></th>
              <th scope="col">File Name</th>
              <th scope="col">Date Completed</th>
              <th scope="col"># of Annotations</th>
              <th scope="col">Confident</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              {/* Table Data 1*/}
              <th scope="row" className="align-middle"></th>
              <td className="align-middle"><u><a href=''>Conopias-trivirgatus-556233.wav</a></u></td>
              <td className="align-middle">12/3/2021</td>
              <td className="align-middle">7</td>
              <td className="align-middle">No</td>
            </tr>
            <tr>
              {/* Table Data 2*/}
              <th scope="row" className="align-middle"></th>
              <td className="align-middle"><u><a href=''>Buteo-swainsoni-468973.wav</a></u></td>
              <td className="align-middle">11/7/2021</td>
              <td className="align-middle">3</td>
              <td className="align-middle">Yes</td>
            </tr>
            <tr>
              {/* Table Data 3*/}
              <th scope="row" className="align-middle"></th>
              <td className="align-middle"><u><a href=''>Chloroceryle-americana-108678.wav</a></u></td>
              <td className="align-middle">11/6/2021</td>
              <td className="align-middle">2</td>
              <td className="align-middle">Yes</td>
            </tr>
          </tbody>
        </table>
        <p align="right"><i><b>Collapse List</b></i></p>
      </div>
      <br></br><br></br><br></br>
    </div>
  );
};

export default withRouter(Profile);
