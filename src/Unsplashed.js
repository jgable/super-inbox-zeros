/* global fetch */

import React, { Component } from 'react'

import './Unsplashed.css'

const ROTATE_INTERVAL = 30000
const RANDOM_IMAGE_URL = 'https://api.unsplash.com/photos/random?client_id=6bb5bb78cfde81736048d37f2d3399d5024a6a5be277ad88a4b1a366a5e4f77f'

/**
 * TODO:
 *  - Handle initial load better
 *  - Transition between images
 */

export class UnsplashedGallery extends Component {
  constructor () {
    super()

    this.state = {
      image: null
    }
  }

  componentDidMount () {
    this._fetchImage();
    this._rotateInterval = setInterval(this._fetchImage.bind(this), ROTATE_INTERVAL)
  }

  componentWillUnmount () {
    clearInterval(this._rotateInterval)
  }

  render () {
    const { image } = this.state
    return (
      <div className='Unsplashed-Gallery'>
        {image
          ? <img alt={image.description} className='Unsplashed-Gallery-Image' src={image.urls.full} />
          : <h3>Loading...</h3>}
      </div>
    )
  }

  _fetchImage () {
    fetch(RANDOM_IMAGE_URL)
      .then((response) => response.json())
      .then((image) => {
        this.setState((state) => ({
          image
        }))
      })
      .catch((err) => {
        // TODO: Handle error
        throw err
      })
  }
}
