import React from 'react';
import { faAtlas, faCog } from '@fortawesome/free-solid-svg-icons';
// import fontawesome from '@fortawesome/fontawesome-free';
import { ReferenceWindow } from './reference';
import { Button, IconButton } from './button';
import SpectroChanger from './annotate/spectroChanger';
import ChangePlayback from './annotate/extraFeatures/changePlayback';
import PreviousAnnotationButton from './annotate/extraFeatures/previousAnnotationButton';

const SideMenuTab = props => {
  const { tab, icon, tabOpen, setTab } = props;
  const swapTabs = tab => {
    const newState = {};
    Object.keys(tabOpen).forEach(key => {
      if (key === tab) newState[tab] = true;
      else newState[key] = false;
    });
    setTab(newState);
  };

  const getColor = tab => {
    return tabOpen[tab] ? 'rgba(255, 255, 255, 0.8)' : null;
  };

  return (
    <IconButton
      size="lg"
      icon={icon}
      style={{ backgroundColor: getColor(tab), float: 'left' }}
      onClick={() => swapTabs(tab)}
      title={tab}
    />
  );
};

const SideMenu = props => {
  const { annotate } = props;
  const { state } = annotate;
  const { projectId, referenceWindowOn, spectrogramDemoOn, toUnsavedClipOn, isRendering, sideMenuOn } = state;
  const sideMenuEnabled = sideMenuOn;

  const initTabOpen = {
    refrences:  referenceWindowOn != null && referenceWindowOn,
    SpectrogramChanger: sideMenuEnabled != null && sideMenuEnabled
  };
  const [tabOpen, setTab] = React.useState(initTabOpen);
  const [height, setHeight] = React.useState('0px');

  React.useEffect(() => {
    setHeight(`${document.getElementById('tabs').firstChild.offsetHeight}px`);
  }, []);

  let tabOpened = null;
  Object.keys(tabOpen).forEach(key => {
    if (tabOpen[key]){
      tabOpened = key;
      console.log(key);
    } 
  });

  return (
    <div id="sidebar" className="sidebar">
      <div
        id="tabs"
        style={{
          display: 'block',
          float: 'left',
          overflow: 'hidden',
          height,
          width: '100%'
        }}
      >
        {referenceWindowOn != null && referenceWindowOn? <SideMenuTab tab="refrences" icon={faAtlas} tabOpen={tabOpen} setTab={tab => setTab(tab)} /> : null }
        {sideMenuEnabled != null && sideMenuEnabled? <SideMenuTab
          tab="SpectrogramChanger"
          icon={faCog}
          tabOpen={tabOpen}
          setTab={tab => setTab(tab)}
        />:null}
        
      </div>
      <text
        style={{
          display: 'block',
          float: 'left',
          overflow: 'hidden',
          width: '100%',
          textAlign: 'center'
        }}
      >
        <b>{tabOpened}</b>
      </text>
      {console.log(referenceWindowOn != null && referenceWindowOn && tabOpen.refrences)}
      {referenceWindowOn != null && referenceWindowOn && tabOpen.refrences ? (
        <ReferenceWindow annotate={annotate} projectId={projectId} />
      ) : null}

      {tabOpen.SpectrogramChanger && !isRendering ? (
        <div className="sideMenuItem">
          {spectrogramDemoOn && (
            <div>
              <SpectroChanger annotate={annotate} />
              <br /> 
            </div>
          )}
          <ChangePlayback annotate={annotate} />
          <PreviousAnnotationButton annotate={annotate} />
          {toUnsavedClipOn && annotate.UnsavedButton ? annotate.UnsavedButton.render() : null}

          <br />
          <Button
            type="primary"
            text="change next data settings"
            onClick={() => {
              annotate.setState({ showActiveForm: true });
            }}
          />
        </div>
      ) : null}
    </div>
  );
};

export default SideMenu;
