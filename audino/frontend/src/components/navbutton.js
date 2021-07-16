import React from 'react';
import { Button } from './button';
import {useState} from 'react';


const NavButton = (props) => {

  const { page, numpage } = props;
  const [ last, setLast ] = useState(false);
  const [ first, setFirst ] = useState(false);
  const [saved, setSaved] = useState(false);
  const projectId = 1;
  // const path = window.location.href.substring(0, index);
  // const index = window.location.href.indexOf('/projects');
  // const projectId = Number(match.params.projectid);

  // const { save } = props;

    const handleNextClip = () => {
      console.log("hi");
      console.log(page);
      if(page < numpage){
        page = page + 1;
        if(page === numpage){
          setLast(true);
        } 
      }

      const url = `/projects/${projectId}/data/${page}/annotate`
      window.location.href = url;

    };

    const handlePreviousClip = () => {
      console.log("bye");
      console.log(page);
      if(page > 0){
        page = page + 1;
        if(page === 0){
          setFirst(true);
        } 
      }
      const url = `/projects/${projectId}/data/${page}/annotate`
      window.location.href = url;

    };


  // // Go to the next audio recording
  // const handleNextClip = (forceNext = false) => {
  //   save();
  //   const {
  //     previous_pages,
  //     num_of_prev,
  //     data,
  //     dataId,
  //     projectId,
  //     next_data_id,
  //     next_data_url,
  //     path
  //   } = this.state;

  //   let success = true;
  //   success = this.checkForSave(success, forceNext);
  //   if (!success) {
  //     return;
  //   }

  //   const next_page_num = num_of_prev + 1;

  //   if (num_of_prev < previous_pages.length - 1) {
  //     localStorage.setItem('count', JSON.stringify(next_page_num));
  //     window.location.href = previous_pages[next_page_num];
  //     return;
  //   }
  //   previous_pages[num_of_prev] = window.location.href;
  //   localStorage.setItem('previous_links', JSON.stringify(previous_pages));
  //   localStorage.setItem('count', JSON.stringify(next_page_num));

  //   let newPageData = data[0];
  //   Object.keys(data).forEach(key => {
  //     key = parseInt(key, 10);
  //     if (data[key].data_id === dataId) {
  //       try {
  //         newPageData = data[key + 1];
  //         const url = `/projects/${projectId}/data/${newPageData.data_id}/annotate`;
  //         /// projects
  //         window.location.href = path + url;
  //       } catch (z) {
  //         if (next_data_id && data[0].data_id !== next_data_id) {
  //           window.location.href = next_data_url;
  //         } else {
  //           window.location.href = `${path}/projects/${projectId}/data`;
  //         }
  //       }
  //     }
  //   });
  // };

  // // Go to previous audio recording
  // const handlePreviousClip = (forceNext = false) => {
  //   this.handleAllSegmentSave();
  //   const { previous_pages, num_of_prev } = this.state;
  //   let success = true;
  //   success = this.checkForSave(success, forceNext);
  //   if (success) {
  //     if (num_of_prev > 0) {
  //       const page_num = num_of_prev - 1;
  //       const previous = previous_pages[page_num];
  //       previous_pages[num_of_prev] = window.location.href;
  //       localStorage.setItem('previous_links', JSON.stringify(previous_pages));
  //       localStorage.setItem('count', JSON.stringify(page_num));
  //       window.location.href = previous;
  //     } else {
  //       console.warn('You have hit the end of the clips you have last seen');
  //     }
  //   }
  // };

  const renderNavButtons = (className, callback) => {
    // const { isSegmentSaving } = this.state;
    return (
      <div className="buttons-container-item">
        <div className={className}>
          <Button
            size="lg"
            type="primary"
            // disabled={isSegmentSaving}
            onClick={callback}
            text={className}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="buttons-container">
      {!first ? (renderNavButtons('previous', () => handlePreviousClip())) : null}
      {!last ? (renderNavButtons('next', () => handleNextClip())) : null }
    </div>
  );
};

export default NavButton;
