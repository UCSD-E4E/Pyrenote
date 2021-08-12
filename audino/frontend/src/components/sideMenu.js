import React from 'react';
import { faAtlas } from '@fortawesome/free-solid-svg-icons';
// import fontawesome from '@fortawesome/fontawesome-free';
import { ReferenceWindow } from './reference';
import { IconButton, SVGButton } from './button';
import SpectroChanger from './annotate/spectroChanger';
import WaveformEdit from './svg/WaveformEdit';
import ChangePlayback from './annotate/extraFeatures/changePlayback';
import PreviousAnnotationButton from './annotate/extraFeatures/previousAnnotationButton';

const faWaveformEdit = {
  prefix: 'fac',
  iconName: 'faWaveformEdit',
  icon: [
    16,
    16,
    [],
    null,
    'M15.486 2.04a.976.976 0 0 0-1.28-.386l-.006.003-9.307 4.745.943 1.668 9.308-4.746-.003-.005a.877.877 0 0 0 .374-1.227l-.03-.053zm-.345 1.279l-.94-1.662a.877.877 0 0 0-.364 1.222l.03.052c.25.443.82.615 1.274.388z'
  ]
};

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
  const { projectId, referenceWindowOn, spectrogramDemoOn, applyPreviousAnnotations,
    toUnsavedClipOn } = state;

  const initTabOpen = {
    refrences: true,
    SpectrogramChanger: false
  };
  const [tabOpen, setTab] = React.useState(initTabOpen);
  const [height, setHeight] = React.useState('0px');

  React.useEffect(() => {
    setHeight(`${document.getElementById('tabs').firstChild.offsetHeight}px`);
  }, []);

  let tabOpened = null;
  Object.keys(tabOpen).forEach(key => {
    if (tabOpen[key]) tabOpened = key;
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
        <SideMenuTab tab="refrences" icon={faAtlas} tabOpen={tabOpen} setTab={tab => setTab(tab)} />
        <SVGButton>
          <WaveformEdit />
        </SVGButton>
        <SideMenuTab
          tab="SpectrogramChanger"
          icon={faWaveformEdit}
          tabOpen={tabOpen}
          setTab={tab => setTab(tab)}
        />
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
      {referenceWindowOn && tabOpen.refrences ? (
        <ReferenceWindow annotate={annotate} projectId={projectId} />
      ) : null}

      {tabOpen.SpectrogramChanger ?
        <div className="sideMenuItem">
          {spectrogramDemoOn && (
            <div>
              <SpectroChanger annotate={annotate}/>  
              <br></br>
            </div>
          )}
          <ChangePlayback annotate={annotate} />
          {applyPreviousAnnotations && <PreviousAnnotationButton annotate={annotate} />}
          {toUnsavedClipOn && annotate.UnsavedButton ? annotate.UnsavedButton.render() : null}

        </div>
       : null}
      
    </div>
  );
};

export default SideMenu;
