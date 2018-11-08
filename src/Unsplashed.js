/* global fetch, Image */

import React, { Component, Fragment } from 'react'
import { animated, Transition } from 'react-spring'

import './Unsplashed.css'

// Unsplashed has a 50 request limit per hour, lets make 30 to be safe
// (Not sure if this is per client_id or IP)
const ROTATE_INTERVAL = 20000 // (1000 * 60) * 2 // 2 mins
const RANDOM_IMAGE_URL = 'https://api.unsplash.com/photos/random?client_id=6bb5bb78cfde81736048d37f2d3399d5024a6a5be277ad88a4b1a366a5e4f77f'
const USE_TEST_IMAGES = true

/**
 * TODO:
 *  - Handle initial load better
 *  - Handle image load errors better
 */

export class UnsplashedGallery extends Component {
  constructor () {
    super()

    this.state = {
      image: null
    }
  }

  componentDidMount () {
    this._fetchImages()
  }

  componentWillUnmount () {
    // This is gross, but promises aren't cancellable
    this._unmounted = true
  }

  render () {
    const { image } = this.state
    return (
      <div className='Unsplashed-Gallery'>
        {image
          ? <Fragment>
            <UnsplashedImage image={image} />
            <UnsplashedLoadingBar key={image.id} />
          </Fragment>
          : <h3>Loading...</h3>}
      </div>
    )
  }

  _fetchImages (waitTime = 0) {
    const imageLoad = USE_TEST_IMAGES
      ? getTestImage()
      : fetch(RANDOM_IMAGE_URL).then((response) => response.json())

    imageLoad
      .then((image) => {
        return Promise.all([
          // Download the image
          downloadImage(image),
          // Wait the designated waitTime before continuing
          waitUntil(waitTime)
        ])
      })
      .then((results) => results[0]) // Pass through the image part
      .then((image) => {
        if (this._unmounted) {
          return
        }

        this.setState((state) => ({
          image
        }))
        // Kick off the next fetch and wait after a small delay to avoid jank
        // during the current transition
        setTimeout(() => {
          this._fetchImages(ROTATE_INTERVAL)
        }, 2000)
      })
      .catch((err) => {
        if (this._unmounted) {
          return
        }

        this._fetchImages(ROTATE_INTERVAL)
        // TODO: Handle errors: rate limited, no network, etc...
        throw err
      })
  }
}

export function UnsplashedImage (props) {
  const { image } = props
  return (
    <Transition
      native
      items={image}
      keys={image.id}
      from={{ transform: 'translateX(100%)' }}
      enter={{ transform: 'translateX(0%)' }}
      leave={{ transform: 'translateX(-100%)' }}>
      {item => props => (
        <animated.div
          className='Unsplashed-Gallery-Image'
          style={{
            backgroundImage: `url(${item.urls.full})`,
            ...props
          }}
        />
      )}
    </Transition>
  )
}

const loadingItems = []
for (let i = 0; i < 100; i++) {
  loadingItems.push(i)
}

/**
 * A little bar that increments progress percent from 0 to 100.
 */
export class UnsplashedLoadingBar extends Component {
  constructor (props) {
    super(props)

    this.state = {
      progress: 0
    }
  }

  componentDidMount () {
    const progressInterval = ROTATE_INTERVAL / 100
    this._progressInterval = setInterval(() => {
      // Clear the interval on the last pass
      if (this.state.progress === 99) {
        clearInterval(this._progressInterval)
      }
      this.setState((state) => ({
        progress: state.progress + 1
      }))
    }, progressInterval)
  }

  componentWillUnmount () {
    clearInterval(this._progressInterval)
  }

  render () {
    const { progress } = this.state
    return (
      <ul className='Unsplashed-Loading-Bar'>
        <UnsplashedLoadingBarItems items={loadingItems.slice(0, progress)} />
      </ul>
    )
  }
}

/**
 * The individual animated blocks that make up the progress bar
 */
export function UnsplashedLoadingBarItems (props) {
  return (
    <Transition
      native
      items={props.items}
      keys={props.items}
      from={{ opacity: 0.1, transform: 'translate3d(0,-10px,0)' }}
      enter={{ opacity: 0.5, transform: 'translate3d(0,0px,0)' }}
      leave={{ opacity: 0, transform: 'translate3d(0,10px,0)' }}>
      {item => props => (
        <animated.li
          className='Unsplashed-Loading-Bar-Item'
          style={{
            ...props
          }}
        />
      )}
    </Transition>
  )
}

/**
 * Using hard coded test images to not disturb the rate limits during dev
 */
let currTestImageIdx = 0
function getTestImage () {
  return new Promise((resolve, reject) => {
    const image = testImages[currTestImageIdx]
    currTestImageIdx = (currTestImageIdx + 1) % testImages.length

    resolve(image)
  })
}

/**
 * To avoid pop-in download the image before rendering it
 */
function downloadImage (image) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve(image)
    }
    img.onerror = () => {
      reject(image)
    }
    img.src = image.urls.full
  })
}

/**
 * A promise that resolves after a certain duration
 */
function waitUntil (duration) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve()
    }, duration)
  })
}

const testImages = [
  {
    'id': 'YsdVhp_vaZ0',
    'created_at': '2018-09-30T17:20:49-04:00',
    'updated_at': '2018-10-10T04:50:51-04:00',
    'width': 5616,
    'height': 3744,
    'color': '#D8ADA3',
    'description': null,
    'urls': { 'raw': 'https://images.unsplash.com/photo-1538342350219-1039eb96194e?ixlib=rb-0.3.5&ixid=eyJhcHBfaWQiOjUxNjN9&s=3bb968614bfd9a25708035c270c094eb',
      'full': 'https://images.unsplash.com/photo-1538342350219-1039eb96194e?ixlib=rb-0.3.5&q=85&fm=jpg&crop=entropy&cs=srgb&ixid=eyJhcHBfaWQiOjUxNjN9&s=8af68aa6778f2d9dd2077e3297daffd0',
      'regular': 'https://images.unsplash.com/photo-1538342350219-1039eb96194e?ixlib=rb-0.3.5&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=1080&fit=max&ixid=eyJhcHBfaWQiOjUxNjN9&s=9fd1dac576ff210ff398e20a0339c5a3',
      'small': 'https://images.unsplash.com/photo-1538342350219-1039eb96194e?ixlib=rb-0.3.5&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=400&fit=max&ixid=eyJhcHBfaWQiOjUxNjN9&s=a2ab9d310b5d467bd64d62d51deaedc1',
      'thumb': 'https://images.unsplash.com/photo-1538342350219-1039eb96194e?ixlib=rb-0.3.5&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=200&fit=max&ixid=eyJhcHBfaWQiOjUxNjN9&s=9eac7bb69342c7332586ada88b50f823' },
    'links': { 'self': 'https://api.unsplash.com/photos/YsdVhp_vaZ0', 'html': 'https://unsplash.com/photos/YsdVhp_vaZ0', 'download': 'https://unsplash.com/photos/YsdVhp_vaZ0/download', 'download_location': 'https://api.unsplash.com/photos/YsdVhp_vaZ0/download' },
    'categories': [],
    'sponsored': false,
    'sponsored_by': null,
    'sponsored_impressions_id': null,
    'likes': 6,
    'liked_by_user': false,
    'current_user_collections': [],
    'slug': 'pink-flowers',
    'user': { 'id': '8PhYFHBDwAU', 'updated_at': '2018-11-02T13:20:16-04:00', 'username': 'elinajosefin', 'name': 'Elina Bernpaintner', 'first_name': 'Elina', 'last_name': 'Bernpaintner', 'twitter_username': null, 'portfolio_url': null, 'bio': null, 'location': null, 'links': { 'self': 'https://api.unsplash.com/users/elinajosefin', 'html': 'https://unsplash.com/@elinajosefin', 'photos': 'https://api.unsplash.com/users/elinajosefin/photos', 'likes': 'https://api.unsplash.com/users/elinajosefin/likes', 'portfolio': 'https://api.unsplash.com/users/elinajosefin/portfolio', 'following': 'https://api.unsplash.com/users/elinajosefin/following', 'followers': 'https://api.unsplash.com/users/elinajosefin/followers' }, 'profile_image': { 'small': 'https://images.unsplash.com/profile-1538343123937-f35230e0be44?ixlib=rb-0.3.5&q=80&fm=jpg&crop=faces&cs=tinysrgb&fit=crop&h=32&w=32&s=e284dbce14fa7762b351a94b488d3a4f', 'medium': 'https://images.unsplash.com/profile-1538343123937-f35230e0be44?ixlib=rb-0.3.5&q=80&fm=jpg&crop=faces&cs=tinysrgb&fit=crop&h=64&w=64&s=15d31cf6f492b545b99d7e659bf1f40b', 'large': 'https://images.unsplash.com/profile-1538343123937-f35230e0be44?ixlib=rb-0.3.5&q=80&fm=jpg&crop=faces&cs=tinysrgb&fit=crop&h=128&w=128&s=19b57220838669d4bb6c54a7505c437e' }, 'instagram_username': null, 'total_collections': 0, 'total_likes': 0, 'total_photos': 24, 'accepted_tos': false },
    'exif': { 'make': 'Canon', 'model': 'Canon EOS 5D Mark II', 'exposure_time': '1/125', 'aperture': '1.6', 'focal_length': '50.0', 'iso': 100 },
    'views': 73097,
    'downloads': 310
  },
  {
    'id': 'PRhEtP3r520',
    'created_at': '2018-09-12T20:14:57-04:00',
    'updated_at': '2018-10-07T17:53:50-04:00',
    'width': 3456,
    'height': 5184,
    'color': '#FC8663',
    'description': null,
    'urls': {
      'raw': 'https://images.unsplash.com/photo-1536797263368-bbe5df5cfcce?ixlib=rb-0.3.5&ixid=eyJhcHBfaWQiOjUxNjN9&s=145cb03d019c6a2fb28b0a4bb32c209b',
      'full': 'https://images.unsplash.com/photo-1536797263368-bbe5df5cfcce?ixlib=rb-0.3.5&q=85&fm=jpg&crop=entropy&cs=srgb&ixid=eyJhcHBfaWQiOjUxNjN9&s=6988f0ee2049652751baa1dcb59b2e46',
      'regular': 'https://images.unsplash.com/photo-1536797263368-bbe5df5cfcce?ixlib=rb-0.3.5&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=1080&fit=max&ixid=eyJhcHBfaWQiOjUxNjN9&s=2a6515a4caf76e70f72d8286f4db6ac7',
      'small': 'https://images.unsplash.com/photo-1536797263368-bbe5df5cfcce?ixlib=rb-0.3.5&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=400&fit=max&ixid=eyJhcHBfaWQiOjUxNjN9&s=79afa6ef7232b36ab902866bbc32e120',
      'thumb': 'https://images.unsplash.com/photo-1536797263368-bbe5df5cfcce?ixlib=rb-0.3.5&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=200&fit=max&ixid=eyJhcHBfaWQiOjUxNjN9&s=b5787de2cfc797db5be4200e3f8e57fb'
    },
    'links': {
      'self': 'https://api.unsplash.com/photos/PRhEtP3r520',
      'html': 'https://unsplash.com/photos/PRhEtP3r520',
      'download': 'https://unsplash.com/photos/PRhEtP3r520/download',
      'download_location': 'https://api.unsplash.com/photos/PRhEtP3r520/download'
    },
    'categories': [],
    'sponsored': false,
    'sponsored_by': null,
    'sponsored_impressions_id': null,
    'likes': 2,
    'liked_by_user': false,
    'current_user_collections': [],
    'slug': null,
    'user': {
      'id': 'DtOdSY0lgrM',
      'updated_at': '2018-10-30T04:35:20-04:00',
      'username': 'coreyapplesauce',
      'name': 'Corey Motta',
      'first_name': 'Corey',
      'last_name': 'Motta',
      'twitter_username': 'coreyapplesauce',
      'portfolio_url': 'http://coreymotta.myportfolio.com',
      'bio': '20 years old. Student @ Roger Williams University\r\nFreelance Photographer / Designer\r\nFor Business Inquiries email: cmotta713@g.rwu.edu',
      'location': 'Bristol & East Providence, Rhode Island',
      'links': {
        'self': 'https://api.unsplash.com/users/coreyapplesauce',
        'html': 'https://unsplash.com/@coreyapplesauce',
        'photos': 'https://api.unsplash.com/users/coreyapplesauce/photos',
        'likes': 'https://api.unsplash.com/users/coreyapplesauce/likes',
        'portfolio': 'https://api.unsplash.com/users/coreyapplesauce/portfolio',
        'following': 'https://api.unsplash.com/users/coreyapplesauce/following',
        'followers': 'https://api.unsplash.com/users/coreyapplesauce/followers'
      },
      'profile_image': {
        'small': 'https://images.unsplash.com/profile-1483812625597-e1bb84a0775c?ixlib=rb-0.3.5&q=80&fm=jpg&crop=faces&cs=tinysrgb&fit=crop&h=32&w=32&s=2567de1e29b1e94d8af5f08ebcfa1d15',
        'medium': 'https://images.unsplash.com/profile-1483812625597-e1bb84a0775c?ixlib=rb-0.3.5&q=80&fm=jpg&crop=faces&cs=tinysrgb&fit=crop&h=64&w=64&s=4512407665989b8bb793649d3c84a704',
        'large': 'https://images.unsplash.com/profile-1483812625597-e1bb84a0775c?ixlib=rb-0.3.5&q=80&fm=jpg&crop=faces&cs=tinysrgb&fit=crop&h=128&w=128&s=27241ca5aa7c9a55a7b1641e03dd0b6c'
      },
      'instagram_username': 'coreyapplesauce',
      'total_collections': 0,
      'total_likes': 464,
      'total_photos': 339,
      'accepted_tos': false
    },
    'exif': {
      'make': 'Canon',
      'model': 'Canon EOS REBEL T5',
      'exposure_time': '1/1250',
      'aperture': '2.0',
      'focal_length': '50.0',
      'iso': 100
    },
    'views': 60208,
    'downloads': 81
  },
  {
    'id': 'ZdMg-ILt20A',
    'created_at': '2017-10-03T01:06:56-04:00',
    'updated_at': '2018-08-28T20:26:27-04:00',
    'width': 4592,
    'height': 3448,
    'color': '#202323',
    'description': 'photography of woman holding brown hand fan',
    'urls': {
      'raw': 'https://images.unsplash.com/photo-1507006899057-6a72c95e8ef4?ixlib=rb-0.3.5&ixid=eyJhcHBfaWQiOjUxNjN9&s=bcfce9eba5b9aba1d03fd299760c3aac',
      'full': 'https://images.unsplash.com/photo-1507006899057-6a72c95e8ef4?ixlib=rb-0.3.5&q=85&fm=jpg&crop=entropy&cs=srgb&ixid=eyJhcHBfaWQiOjUxNjN9&s=c67fb0dc2d4c15ba12e5227da8526890',
      'regular': 'https://images.unsplash.com/photo-1507006899057-6a72c95e8ef4?ixlib=rb-0.3.5&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=1080&fit=max&ixid=eyJhcHBfaWQiOjUxNjN9&s=38d47588936769290af30cba4a66e7c0',
      'small': 'https://images.unsplash.com/photo-1507006899057-6a72c95e8ef4?ixlib=rb-0.3.5&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=400&fit=max&ixid=eyJhcHBfaWQiOjUxNjN9&s=c1d84e8e820eaf6680eb8b0230050dcd',
      'thumb': 'https://images.unsplash.com/photo-1507006899057-6a72c95e8ef4?ixlib=rb-0.3.5&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=200&fit=max&ixid=eyJhcHBfaWQiOjUxNjN9&s=f1f2699a43c89c9fd566e6a4f9146dc7'
    },
    'links': {
      'self': 'https://api.unsplash.com/photos/ZdMg-ILt20A',
      'html': 'https://unsplash.com/photos/ZdMg-ILt20A',
      'download': 'https://unsplash.com/photos/ZdMg-ILt20A/download',
      'download_location': 'https://api.unsplash.com/photos/ZdMg-ILt20A/download'
    },
    'categories': [],
    'sponsored': false,
    'sponsored_by': null,
    'sponsored_impressions_id': null,
    'likes': 36,
    'liked_by_user': false,
    'current_user_collections': [],
    'slug': null,
    'user': {
      'id': 'bqmob8yPmvw',
      'updated_at': '2018-11-07T06:26:17-05:00',
      'username': 'danielapodaca96',
      'name': 'Daniel Apodaca',
      'first_name': 'Daniel',
      'last_name': 'Apodaca',
      'twitter_username': null,
      'portfolio_url': null,
      'bio': 'Buy me a coffee: http://paypal.me/Danielapodaca96\r\nTag me on insta @danielapodaca96\r\nContact: dapodacafilms@gmail.com',
      'location': 'Mexico',
      'links': {
        'self': 'https://api.unsplash.com/users/danielapodaca96',
        'html': 'https://unsplash.com/@danielapodaca96',
        'photos': 'https://api.unsplash.com/users/danielapodaca96/photos',
        'likes': 'https://api.unsplash.com/users/danielapodaca96/likes',
        'portfolio': 'https://api.unsplash.com/users/danielapodaca96/portfolio',
        'following': 'https://api.unsplash.com/users/danielapodaca96/following',
        'followers': 'https://api.unsplash.com/users/danielapodaca96/followers'
      },
      'profile_image': {
        'small': 'https://images.unsplash.com/profile-1505999155382-4e8ba752b84b?ixlib=rb-0.3.5&q=80&fm=jpg&crop=faces&cs=tinysrgb&fit=crop&h=32&w=32&s=de6aae10986ddd07defe0ba698d1ad02',
        'medium': 'https://images.unsplash.com/profile-1505999155382-4e8ba752b84b?ixlib=rb-0.3.5&q=80&fm=jpg&crop=faces&cs=tinysrgb&fit=crop&h=64&w=64&s=db275c0fbd379c7ea7b6a361d5140c28',
        'large': 'https://images.unsplash.com/profile-1505999155382-4e8ba752b84b?ixlib=rb-0.3.5&q=80&fm=jpg&crop=faces&cs=tinysrgb&fit=crop&h=128&w=128&s=dec917ee46d6d4f267b54113bcf64717'
      },
      'instagram_username': 'danielapodaca96',
      'total_collections': 0,
      'total_likes': 13,
      'total_photos': 73,
      'accepted_tos': false
    },
    'exif': {
      'make': 'Panasonic',
      'model': 'DMC-G7',
      'exposure_time': '1/50',
      'aperture': '1.7',
      'focal_length': '25.0',
      'iso': 400
    },
    'views': 315251,
    'downloads': 1209
  }
]
