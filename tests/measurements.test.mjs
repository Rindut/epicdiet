import test from 'node:test';
import assert from 'node:assert/strict';
import {displayMeasure,canonicalMeasure,rulerTicks} from '../dist/measurements.js';
import {validateEntry,fmt} from '../dist/core.js';
test('Imperial display and typed values convert to canonical kg/cm',()=>{
  assert.equal(displayMeasure(82,'baselineKg','lb'),180.8);
  assert.ok(Math.abs(canonicalMeasure('180.8','baselineKg','lb')-82)<.02);
  assert.equal(displayMeasure(156,'heightCm','ft'),5.12);
  assert.ok(Math.abs(canonicalMeasure('5,5','heightCm','ft')-167.64)<1e-9);
  assert.equal(canonicalMeasure('40','baselineKg','kg'),40);
});
test('Ruler ticks align the selected measure with the center marker',()=>{
  for(const [name,unit,value] of [['baselineKg','kg',70],['heightCm','cm',170]]){
    const selected=rulerTicks(value,name,unit).find(t=>t.label===value);
    assert.equal(selected.position,50);assert.equal(selected.major,true);
  }
});
test('Daily weight keeps two decimals and comma input',()=>{
  const {entry,errors}=validateEntry({localDate:'2026-09-24',weightKg:'81,95'},{startDate:'2026-09-01'},'2026-09-24');
  assert.deepEqual(errors,{});assert.equal(entry.weightKg,81.95);
  assert.equal(validateEntry({localDate:'2026-09-24',weightKg:'81.954'},{startDate:'2026-09-01'},'2026-09-24').entry.weightKg,81.95);
  assert.equal(fmt(81.95),'81,95');assert.equal(fmt(82),'82,0');
});
