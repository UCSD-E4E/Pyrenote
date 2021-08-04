import React from 'react';
import { Button } from '../../button';

class UnsavedButton extends React.Component {
  constructor(ws, active, props) {
    super(props);
    this.regions = {};
    this.currRegion = null;
    this.selectedRegion = null;
    this.pos = 0;
    this.wavesurfer = ws;
    this.active = active;
    this.state = { count: 0 };
  }

  addUnsaved(region, ignore = false) {
    if (!region.saved && !ignore) {
      return;
    }
    const id = region.id;
    const item = [region, null, null];

    if (this.selectedRegion === null) {
      this.selectedRegion = id;
    }

    if (this.currRegion !== id) {
      // create a ref from previous region to this new one
      if (this.currRegion !== null) {
        this.regions[this.currRegion][2] = id;
      }
      // create a ref from this new one to previous region
      item[1] = this.currRegion;
      this.currRegion = id;
    }
    this.regions[id] = item;
    const { count } = this.state;
    this.state.count = count + 1;
  }

  removeSaved(region) {
    const id = region.id;
    const item = this.regions[id];
    // close gap
    try {
      this.regions[item[2]][1] = this.regions[id][1];
    } catch (e) {
      console.warn('no region ahead');
    }

    try {
      this.regions[item[1]][2] = this.regions[id][2];
    } catch (e) {
      console.warn('no region previous');
    }

    if (this.selectedRegion === id) {
      this.selectedRegion = null;
    }
    if (this.currRegion !== id && item[2] !== null) {
      this.currRegion = item[2];
    } else {
      this.currRegion = item[1];
    }

    delete this.regions[id];
    const { count } = this.state;
    this.state.count = count - 1;
  }

  ifSelectedRegionNull() {
    if (this.selectedRegion === null) {
      let success = true;
      Object.keys(this.regions).forEach(region => {
        if (success) {
          this.selectedRegion = region;
          success = false;
        }
      });
    }
    return this.selectedRegion !== null;
  }

  iteratePos() {
    if (!this.ifSelectedRegionNull()) {
      return;
    }

    const start = this.regions[this.selectedRegion][0].start;
    const duration = this.wavesurfer.getDuration();
    this.wavesurfer.seekAndCenter(start / duration);
    this.selectedRegion = this.regions[this.selectedRegion][2];

    this.ifSelectedRegionNull();
  }

  render() {
    const { count } = this.state;
    let msg = `${count} Unsaved Left`;
    if (this.active !== 'pending') {
      msg = `${count} Left to Review`;
    }

    return (
      <div>
        <Button text={msg} size="lg" type="primary" onClick={() => this.iteratePos()} />
      </div>
    );
  }
}

export default UnsavedButton;
