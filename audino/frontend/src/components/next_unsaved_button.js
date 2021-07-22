import React from 'react';
import { Button } from './button';

class UnsavedButton {
  constructor(ws) {
    this.regions = {}
    this.currRegion = null
    this.selectedRegion = null
    this.count = 0
    this.pos = 0
    this.wavesurfer = ws
  }
  
  addUnsaved(region) {
    let id = region.id
    let item = [region, null, null]

    if (this.selectedRegion === null) {
      this.selectedRegion = id
    }

    if ( this.currRegion !== id) {
      // create a ref from previous region to this new one
      if (this.currRegion !== null) {
        this.regions[this.currRegion][2] = (id)
      }
      // create a ref from this new one to previous region
      item[1] = this.currRegion
      this.currRegion = id
    } 
    this.regions[id] = item
    this.count += 1
  }

  removeSaved(region) {
    let id = region.id
    let item = this.regions[id]
    //close gap
    this.regions[item[2]][1] = this.regions[id][1]  
    this.regions[item[1]][2] = this.regions[id][2]  

    if (this.selectedRegion === id) {
      this.selectedRegion = null
    }
    if ( this.currRegion !== id && item[2] !== null) {
      this.currRegion = item[2]
    } else {
      this.currRegion = item[1]
    }

    delete this.regions[id]
    this.count -= 1
    
  }

  ifSelectedRegionNull() {
    if (this.selectedRegion === null) {
      this.regions.forEach(region => {
        this.selectedRegion = region[1]
        return false;
      })
    }
    return this.selectedRegion !== null
  }

  iteratePos() {
    let success = this.ifSelectedRegionNull()
    
    if (success) {
      this.selectedRegion = this.regions[this.selectedRegion][2]
    } 
    success = this.ifSelectedRegionNull()
    if (this.selectedRegion === null) {
      let start = this.regions[this.selectedRegion][0].start
      this.wavesurfer.seekAndCenter(start)
    }
  }

  render() {
    let msg = this.count + " Unsaved Left"
    console.log(msg)
    return(
      <div>
        <Button
         text={msg}
         size='lg'
         type='primary'
         onClick={() => this.iteratePos}
        />
      </div>
    )
  }
}

export default UnsavedButton;
