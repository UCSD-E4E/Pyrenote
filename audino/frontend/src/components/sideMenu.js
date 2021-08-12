import React from 'react';
import { faAtlas } from '@fortawesome/free-solid-svg-icons';
import fontawesome from '@fortawesome/fontawesome-free'
import { ReferenceWindow } from './reference';
import { IconButton, SVGButton } from './button';
import SpectroChanger from './annotate/spectroChanger';
import WaveformEdit from './svg/WaveformEdit';
const faWaveformEdit = {
  prefix: 'fac',
  iconName: 'faWaveformEdit',
  icon: [
    16, 16,
    [],
    null,
    "M15.486 2.04a.976.976 0 0 0-1.28-.386l-.006.003-9.307 4.745.943 1.668 9.308-4.746-.003-.005a.877.877 0 0 0 .374-1.227l-.03-.053zm-.345 1.279l-.94-1.662a.877.877 0 0 0-.364 1.222l.03.052c.25.443.82.615 1.274.388z"
  ]
}

const SideMenuTab = props => {
  console.log(faAtlas)
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
    />
  );
};

const SideMenu = props => {
  const { annotate } = props;
  const { state } = annotate;
  const { projectId, referenceWindowOn, spectrogramDemoOn } = state;

  const initTabOpen = {
    one: true,
    two: false
  };
  const [tabOpen, setTab] = React.useState(initTabOpen);
  const [height, setHeight] = React.useState('0px');

  React.useEffect(() => {
    setHeight(`${document.getElementById('tabs').firstChild.offsetHeight}px`);
  }, []);

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
        <SideMenuTab tab="one" icon={faAtlas} tabOpen={tabOpen} setTab={tab => setTab(tab)} />
        <SVGButton><WaveformEdit></WaveformEdit></SVGButton>
        <SideMenuTab tab="two" icon={faWaveformEdit} tabOpen={tabOpen} setTab={tab => setTab(tab)} />
      </div>
      {referenceWindowOn && tabOpen.one ? (
        <ReferenceWindow annotate={annotate} projectId={projectId} />
      ) : null}
      {spectrogramDemoOn && tabOpen.two ? <SpectroChanger annotate={annotate} /> : null}
    </div>
  );
};

export default SideMenu;
