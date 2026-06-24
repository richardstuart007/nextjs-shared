'use client'

import { MyInput } from '../../components/MyInput'
import { MyInput_dftClass_Project } from './defaults'

//----------------------------------------------------------------------------------------------
//  MyInputProject — dev-app wrapper simulating a consuming project's project-default wrapper
//----------------------------------------------------------------------------------------------
export function MyInputProject(props: React.ComponentProps<typeof MyInput>) {
  return <MyInput defaultClass={MyInput_dftClass_Project} {...props} />
}
