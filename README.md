[![](https://raw.githubusercontent.com/honkita/MD-Links/main/Pixel_GitHub.svg)](https://github.com/honkita) [![](https://raw.githubusercontent.com/honkita/MD-Links/main/Pixel_Link.svg)](https://elitelu.com) [![](https://raw.githubusercontent.com/honkita/MD-Links/main/Pixel_LinkedIn.svg)](https://www.linkedin.com/in/elitelu/)

# GitHub Stats (Elite's version)

![](https://raw.githubusercontent.com/honkita/PixelButtons/main/Pixel_Maintained.svg)

> [!IMPORTANT]
> Because of GitHub's rate limit, it is advised to fork this project and deploy on Vercel or a similar platform. Along with this, generating a personal access token is mandatory because without one, the max number of requests per hour is 50 and private repositories CAN NOT be accessed. While there is caching for users that refreshes every 1–5 minutes, it is still recommended.

This is a simple lightweight backend service that generates SVG images displaying GitHub statistics for a given user. The statistics include the number of lines coded in different programming languages, the percentage of repositories coded in those languages, and miscellaneous information such as the total number of repositories, commits, stars, fetch requests, issues, viewers, and forks.

The icons are sourced from [Devicon](https://devicon.dev/) and [Octicons](https://primer.style/octicons/), open-source projects that provide a set of icons representing various programming languages and technologies.

## Display Information

[![](https://git-hub-stats-backend.vercel.app?github=honkita&colour=default)](https://github.com/honkita/GitHub-Stats-Backend)

| Item          | Description                                                                                                                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Lines         | Displays graphically the number of lines coded with a given language and displays the user's top languages.                                                                                                                                                                                |
| Repos         | Displays graphically the percentage of repos coded with a given language and displays the user's top languages.                                                                                                                                                                            |
| Miscellaneous | Displays the following information from top to bottom: <ul><li>Number of Repos</li><li>Total number of commits</li><li>Total number of stars</li><li>Total number of fetch requests</li><li>Total number of issues</li><li>Total number of viewers</li><li>Total number of forks</li></ul> |

## How to use

### Basic

Replace **GITHUB_USERNAME** with your username on GitHub.

```
[![](https://git-hub-stats-backend.vercel.app?github=GITHUB_USERNAME)](https://github.com/honkita/GitHub-Stats-Backend)
```

That's it!

### Additional parameters

| Parameter | Type    | Description                                                                                                                                                                   |
| --------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| limit     | Integer | Denotes the **max** number of unique languages that can be displayed. The default/absolute max value is 5. If there are more languages, they will be grouped under **Other**. |
| colour    | String  | Denotes the theme of the colours used for the display.                                                                                                                        |

A code snippet example with the limit set as **3** and the colour theme set as **reds** is as follows:

```
[![](https://git-hub-stats-backend.vercel.app?github=GITHUB_USERNAME&colour=reds&limit=3)](https://github.com/honkita/GitHub-Stats-Backend)
```

## Colour Themes

> [!Note]
> The default scheme is mono_dark.

### Monochromes

<table>
  <tr>
    <td>
       <h4>mono_dark</h4>
        <center><img title="GitHub Stats" src="https://git-hub-stats-backend.vercel.app?github=honkita&colour=mono_dark"/></center>
    </td>
    <td>
      <h4>reds</h4>
      <center><img title="GitHub Stats" src="https://git-hub-stats-backend.vercel.app?github=honkita&colour=reds"/></center>
    </td>
  </tr>
  <tr>
    <td>
      <h4>blues</h4>
      <center><img title="GitHub Stats" src="https://git-hub-stats-backend.vercel.app?github=honkita&colour=blues"/></center>
    </td>
  </tr>
</table>

### Atmospherics

<table>
  <tr>
    <td>
      <h4>slate</h4>
      <center><img title="GitHub Stats" src="https://git-hub-stats-backend.vercel.app?github=honkita&colour=slate"/></center>
    </td>
    <td>
      <h4>breezy</h4>
      <center><img title="GitHub Stats" src="https://git-hub-stats-backend.vercel.app?github=honkita&colour=breezy"/></center>
    </td>
  </tr>
  <tr>
</table>

### Motifs

<table>
  <tr>
    <td>
      <h4>olive</h4>
      <center><img title="GitHub Stats" src="https://git-hub-stats-backend.vercel.app?github=honkita&colour=olive"/></center>
    </td>
    <td>
      <h4>cur</h4>
      <center><img title="GitHub Stats" src="https://git-hub-stats-backend.vercel.app?github=honkita&colour=cur"/></center>
    </td>
  </tr>
  <tr>
    <td>
       <h4>fox</h4>
        <center><img title="GitHub Stats" src="https://git-hub-stats-backend.vercel.app?github=honkita&colour=fox"/></center>
    </td>
    <td>
       <h4>owl</h4>
        <center><img title="GitHub Stats" src="https://git-hub-stats-backend.vercel.app?github=honkita&colour=owl"/></center>
    </td>
  </tr>
  <tr>
</table>

## Forking and Deploying on Your Own

Before forking and deploying, please generate a Personal Access Token (PAT) on GitHub. This can be done by heading to **Settings**, then **Developer Settings**. Under **Developer Settings**, select **Personal Access Token** and select **Tokens (classic)**. Generate a new classic token. I set the expiration of my token to **No Expiration**, but that is because I am lazy. The scopes that must be enabled are as follows:

-  repo
-  user
-  read:project

Do **NOT** enable any admin scopes. Once generated, copy the token.

> [!IMPORTANT]
> Do not close the page until you have copied the token. The page with the token value will NOT be viewable!

> [!CAUTION]
> Do not share the token with anyone. This token will only be used in one other place, which is on the deployment platform's environment variables section.

The deployment platform that is used for this project is [Vercel](https://vercel.com). Deploy the site as you would with any repository from GitHub. Upon doing so, change the environment variables. Create a variable called **GHTOKEN** and set the value as the PAT. Upon doing so, use as follows, replacing **INSERT_URL_HERE** with the new URL from the deployment platform:

```
[![](INSERT_URL_HERE?github=GITHUB_USERNAME)](https://github.com/honkita/GitHub-Stats-Backend)
```
