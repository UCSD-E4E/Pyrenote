import React, {useEffect} from 'react';
import { faAtlas } from '@fortawesome/free-solid-svg-icons';
import { ReferenceWindow } from './reference';
import { IconButton } from './button';

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
    />
  );
};

const SideMenu = props => {
  const { annotate } = props;
  const { state } = annotate;
  const { projectId, referenceWindowOn } = state;

  const initTabOpen = {
    reference: true,
    reference2: false
  };
  const [tabOpen, setTab] = React.useState(initTabOpen);
  const [height, setHeight]  = React.useState("0px");

  React.useEffect(() => {
    setHeight(document.getElementById("tabs").firstChild.offsetHeight + 'px')
  }, []);

  return (
    <div id="sidebar" className="sidebar">
      <div id="tabs" style={{display: "block", float: "left", overflow: "hidden", height: height, width: "100%"}}>
        <SideMenuTab tab="reference" icon={faAtlas} tabOpen={tabOpen} setTab={tab => setTab(tab)} />
        <SideMenuTab
          tab="reference2"
          icon={faAtlas}
          tabOpen={tabOpen}
          setTab={tab => setTab(tab)}
        />
        <SideMenuTab
          tab="reference3"
          icon={faAtlas}
          tabOpen={tabOpen}
          setTab={tab => setTab(tab)}
        />
      </div>
      {referenceWindowOn && tabOpen.reference ? (
        <ReferenceWindow annotate={annotate} projectId={projectId} />
      ) : null}
      {referenceWindowOn && tabOpen.reference2 ? (
        <ReferenceWindow annotate={annotate} projectId={projectId} />
      ) : null}
    </div>
  );
};

export default SideMenu;
