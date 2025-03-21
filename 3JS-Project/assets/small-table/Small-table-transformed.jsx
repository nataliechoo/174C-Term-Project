/*
Auto-generated by: https://github.com/pmndrs/gltfjsx
Command: npx gltfjsx@6.5.3 small-table-transformed.glb --transform --simplify 
Files: small-table-transformed.glb [244.2KB] > /Users/nataliechoo/CSclasses/174C-Term-Project/3JS-Project/assets/small-table/small-table-transformed-transformed.glb [132.22KB] (46%)
*/

import React from 'react'
import { useGLTF } from '@react-three/drei'

export function Model(props) {
  const { nodes, materials } = useGLTF('/small-table-transformed-transformed.glb')
  return (
    <group {...props} dispose={null}>
      <mesh geometry={nodes.model_0.geometry} material={materials['model_0.004']} rotation={[Math.PI / 2, 0, 0]} />
    </group>
  )
}

useGLTF.preload('/small-table-transformed-transformed.glb')
