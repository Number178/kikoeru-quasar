import MainLayout from 'layouts/MainLayout'
import Works from 'pages/Works.vue'
import Work from 'pages/Work.vue'
import List from 'pages/List.vue'
import Player from 'pages/Player.vue'

const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        component: Works
      },
      {
        path: '/player',
        component: Player
      },
      {
        path: '/work/:id',
        component: Work
      },
      {
        path: '/search/:keyword?',
        component: Works
      },
      {
        path: '/circle/:id',
        props: { restrict: "circle" },
        component: Works
      },
      {
        path: '/tag/:id',
        props: { restrict: "tag" },
        component: Works
      },
      {
        path: '/va/:id',
        props: { restrict: "va" },
        component: Works
      },
      {
        path: '/circles',
        props: { restrict: "circle" },
        component: List
      },
      {
        path: '/tags',
        props: { restrict: "tag" },
        component: List
      },
      {
        path: '/vas',
        props: { restrict: "va" },
        component: List
      },
    ]
  }
]

// Always leave this as last one
if (process.env.MODE !== 'ssr') {
  routes.push({
    path: '*',
    component: () => import('pages/Error404.vue')
  })
}

export default routes
