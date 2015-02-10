'use strict'

function MatrixCameraController() { 
}

var proto = MatrixCameraController.prototype

proto.getMatrix = function(t, out) {
}

proto.idle = function(t) {
}

proto.lookAt = function(t, center, eye, up) {
}

proto.rotate = function(t, yaw, pitch, roll) {
}

proto.zoom = function(t, dr) {
}

proto.pan = function(t, dx, dy, dz) {
}

proto.move = function(t, dx, dy, dz) {
}

proto.translate = function(t, dx, dy, dz) {
}

proto.setMatrix = function(t, mat) {
}

//Stub accessors
proto.setEye = proto.setUp = proto.setCenter = proto.setDistance = function() {}
proto.getDistance = function() { return 0.0 }
proto.getUp = proto.getEye = proto.setCenter = function(t, out) { out[0] = out[1] = out[2]; return out }

function createMatrixCameraController() {
}