/*
Auto-generated by: https://github.com/pmndrs/gltfjsx
Command: npx gltfjsx@6.5.3 assets/base-and-window/base_and_window.glb --transform --simplify 
Files: assets/base-and-window/base_and_window.glb [2.77MB] > /home/shelbypop/CSC174C_ANIMATION/174C-Term-Project/3JS-Project/base_and_window-transformed.glb [208KB] (92%)
*/

import React from 'react'
import { useGLTF } from '@react-three/drei'

export function Model(props) {
  const { nodes, materials } = useGLTF('/base_and_window-transformed.glb')
  return (
    <group {...props} dispose={null}>
      <mesh geometry={nodes.model_0.geometry} material={materials.model_0} rotation={[Math.PI / 2, 0, 0]} />
    </group>
  )
}

useGLTF.preload('/base_and_window-transformed.glb')
