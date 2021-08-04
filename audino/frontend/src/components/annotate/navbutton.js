import React from 'react';
import { Button } from '../button';
import { handleAllSegmentSave } from '../../pages/annotatefunctions';

const NavButton = props => {
  const { annotate } = props;

  const checkForSave = (success, forceClip, dir) => {
    const { wavesurfer } = annotate.state;
    annotate.setState({ direction: dir });
    Object.values(wavesurfer.regions.list).forEach(segment => {
      if (segment.saved === false && !forceClip) {
        if (segment.data.annotations == null) {
          annotate.setState({
            errorUnsavedMessage: `There are regions without a label! You can't leave yet! If you are sure, click "force ${dir}"`
          });
          success = false;
        }
      }
    });
    return success;
  }

  // Go to the next audio recording
  const handleNextClip = (forceNext = false) => {
    handleAllSegmentSave(annotate);
    const {
      previous_pages,
      num_of_prev,
      data,
      dataId,
      projectId,
      next_data_id,
      next_data_url,
      path,
    } = annotate.state;

    let success = true;
    success = checkForSave(success, forceNext, 'next');
    if (!success) {
      return;
    }
    const next_page_num = num_of_prev + 1;

    if (num_of_prev < previous_pages.length - 1) {
      localStorage.setItem('count', JSON.stringify(next_page_num));
      window.location.href = previous_pages[next_page_num];
      return;
    }
    previous_pages[num_of_prev] = window.location.href;
    localStorage.setItem('previous_links', JSON.stringify(previous_pages));
    localStorage.setItem('count', JSON.stringify(next_page_num));

    let newPageData = data[0];
    Object.keys(data).forEach(key => {
      key = parseInt(key, 10);
      if (data[key].data_id === dataId) {
        try {
          newPageData = data[key + 1];
          const url = `/projects/${projectId}/data/${newPageData.data_id}/annotate`;
          /// projects
          window.location.href = path + url;
        } catch (z) {
          if (next_data_id && data[0].data_id !== next_data_id) {
            window.location.href = next_data_url;
          } else {
            window.location.href = `${path}/projects/${projectId}/data`;
          }
        }
      }
    });
  };

  // Go to previous audio recording
  const handlePreviousClip = (forcePrev = false) => {
    handleAllSegmentSave(annotate);
    const { previous_pages, num_of_prev } = annotate.state;
    let success = true;
    success = checkForSave(success, forcePrev, 'previous');
    if (success) {
      if (num_of_prev > 0) {
        const page_num = num_of_prev - 1;
        const previous = previous_pages[page_num];
        previous_pages[num_of_prev] = window.location.href;
        localStorage.setItem('previous_links', JSON.stringify(previous_pages));
        localStorage.setItem('count', JSON.stringify(page_num));
        window.location.href = previous;
      } else {
        console.warn('You have hit the end of the clips you have last seen');
        window.location.href = `${path}/projects/${projectId}/data`;
      }
    }
  };

  const renderNavButtons = (className, callback) => {
    const { isSegmentSaving } = annotate.state;
    return (
      <div className="buttons-container-item">
        <div className={className}>
          <Button
            size="lg"
            type="primary"
            disabled={isSegmentSaving}
            onClick={callback}
            text={className}
          />
        </div>
      </div>
    );
  };

  const checkForce = () => {
    const unsaved = annotate.state.errorUnsavedMessage;
    const dir = annotate.state.direction;
    let func;
    let text;
    if (dir === 'next') {
      func = handleNextClip;
      text = 'Force Next';
    }
    if (dir === 'previous') {
      func = handlePreviousClip;
      text = 'Force Prev';
    }
    if (unsaved) {
      return (
        <div className="buttons-container-item" style={{ margin: 'auto', marginBottom: '2%' }}>
          <Button
            size="lg"
            type="danger"
            disabled={annotate.state.isSegmentSaving}
            onClick={() => func(true)}
            isSubmitting={annotate.state.isSegmentSaving}
            text={text}
          />
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <div className="buttons-container">
        {renderNavButtons('previous', () => handlePreviousClip())}
        {renderNavButtons('next', () => handleNextClip())}
      </div>
      <div
        className="buttons-container"
        // style={{ margin: 'auto', marginBottom: '2%' }}
      >
        {checkForce()}
      </div>
    </div>
  );
};

export default NavButton;
