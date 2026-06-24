'use client'

import MyBox from '../../components/MyBox'
import { MyBox_dftClass_Project } from './defaults'

//----------------------------------------------------------------------------------------------
//  MyBoxProject — dev-app wrapper simulating a consuming project's project-default wrapper
//----------------------------------------------------------------------------------------------
export function MyBoxProject(props: React.ComponentProps<typeof MyBox>) {
  return <MyBox defaultClass={MyBox_dftClass_Project} {...props} />
}
