'use strict'

var bsearch = require('binary-search-bounds')
var m4interp = require('mat4-interpolate')
var invert44 = require('gl-mat4/invert')
var rotateX = require('gl-mat4/rotateX')
var rotateY = require('gl-mat4/rotateY')
var rotateZ = require('gl-mat4/rotateZ')
var lookAt = require('gl-mat4/lookAt')
var translate = require('gl-mat4/translate')
var scale     = require('gl-mat4/scale')
var normalize = require('gl-vec3/normalize')

var DEFAULT_CENTER = [0,0,0]

module.exports = createMatrixCameraController

function MatrixCameraController(initialMatrix) {
  this._components    = initialMatrix.slice()
  this._time          = [0]
  this.prevMatrix     = initialMatrix.slice()
  this.nextMatrix     = initialMatrix.slice()
  this.computedMatrix = initialMatrix.slice()
  this.computedInverse = initialMatrix.slice()
  this.computedEye    = [0,0,0]
  this.computedUp     = [0,0,0]
}

var proto = MatrixCameraController.prototype

proto.recalcMatrix = function(t) {
  var time = this._time
  var tidx = bsearch.le(time, t)
  var mat = this.computedMatrix
  if(tidx < 0) {
    return
  }
  var comps = this._components
  if(tidx === time.length-1) {
    var ptr = 16*tidx
    for(var i=0; i<16; ++i) {
      mat[i] = comps[ptr++]
    }
  } else {
    var dt = (time[tidx+1] - time[tidx])
    var ptr = 16*tidx
    var prev = this.prevMatrix
    var allEqual = true
    for(var i=0; i<16; ++i) {
      prev[i] = comps[ptr++]
    }
    var next = this.nextMatrix
    for(var i=0; i<16; ++i) {
      next[i] = comps[ptr++]
      allEqual = allEqual && (prev[i] === next[i])
    }
    if(dt < 1e-6 || allEqual) {
      for(var i=0; i<16; ++i) {
        mat[i] = prev[i]
      }
    } else {
      m4interp(mat, prev, next, (t - time[tidx])/dt)
    }
  }

  var up = this.computedUp
  up[0] = mat[1]
  up[1] = mat[5]
  up[2] = mat[6]
  normalize(up, up)

  var imat = this.computedInverse
  invert44(imat, mat)
  var eye = this.computedEye
  var w = imat[15]
  eye[0] = mat[12]/w
  eye[1] = mat[13]/w
  eye[2] = mat[14]/w
}

proto.getMatrix = function(t, out) {
  this.recalcMatrix(t)
  var mat = this.computedMatrix
  if(out) {
    for(var i=0; i<16; ++i) {
      out[i] = mat[i]
    }
    return out
  }
  return mat
}

proto.idle = function(t) {
  var time = this._time
  var t0 = time[time.length-1]
  if(t <= t0) {
    return
  }
  var mc = this._components
  var ptr = mc.length-16
  for(var i=0; i<16; ++i) {
    mc.push(mc[ptr++])
  }
  time.push(t)
}

proto.flush = function(t) {
  var idx = bsearch.gt(this._time, t) - 2
  if(idx < 0) {
    return
  }
  this._time.slice(0, idx)
  this._components.slice(0, 16*idx)
}

proto.lastT = function() {
  return this._time[this._time.length-1]
}

proto.lookAt = function(t, eye, center, up) {
  this.recalcMatrix(t)
  eye    = eye || this.computedEye
  center = center || DEFAULT_CENTER
  up     = up || this.computedUp
  this.setMatrix(t, lookAt(this.computedMatrix, eye, center, up))
}

proto.rotate = function(t, yaw, pitch, roll) {
  this.recalcMatrix(t)
  var mat = this.computedInverse
  if(yaw)   rotateY(mat, mat, yaw)
  if(pitch) rotateX(mat, mat, pitch)
  if(roll)  rotateZ(mat, mat, roll)
  this.setMatrix(t, invert44(this.computedMatrix, mat))
}

proto.zoom = function(t, dr) {
  this.recalcMatrix(t)
  var mat = this.computedMatrix
  
  //TODO
}

proto.pan = function(t, dx, dy, dz) {
  this.recalcMatrix(t)
  var mat = this.computedMatrix
  
  //TODO
}

var tvec = [0,0,0]
proto.translate = function(t, dx, dy, dz) {
  this.recalcMatrix(t)
  var mat = this.computedMatrix
  tvec[0] = dx
  tvec[1] = dy
  tvec[2] = dz
  translate(mat, mat, tvec)
  this.setMatrix(t, mat)
}

proto.setMatrix = function(t, mat) {
  if(t < this.lastT()) {
    return
  }
  this._time.push(t)
  for(var i=0; i<16; ++i) {
    this._components.push(mat[i])
  }
}

proto.getEye = function(t, out) {
  this.recalcMatrix(t)
  return this.computedEye
}

proto.getUp = function(t, out) {
  this.recalcMatrix(t)
  return this.computedUp
}

proto.getZoom = function(t) {
  return 1.0
}

function createMatrixCameraController(options) {
  return new MatrixCameraController([
    1,0,0,0,
    0,1,0,0,
    0,0,1,0,
    0,0,0,1])
}