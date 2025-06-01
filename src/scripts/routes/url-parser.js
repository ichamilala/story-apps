function extractPathnameSegments(path) {
  const splitUrl = path.split('/');

  return {
    resource: splitUrl[1] || null,
    id: splitUrl[2] || null,
  };
}

function constructRouteFromSegments(pathSegments) {
  let pathname = '';

  if (pathSegments.resource) {
    pathname = pathname.concat(`/${pathSegments.resource}`);
  }

  if (pathSegments.id) {
    pathname = pathname.concat('/:id');
  }

  return pathname || '/';
}

export function getActivePathname() {
  return location.hash.replace('#', '') || '/';
}

export function getActiveRoute() {
  const pathname = getActivePathname();
  const urlSegments = extractPathnameSegments(pathname);
  return constructRouteFromSegments(urlSegments);
}

export function parseActivePathname() {
  const pathname = getActivePathname();
  return extractPathnameSegments(pathname);
}

export function getRoute(pathname) {
  const urlSegments = extractPathnameSegments(pathname);
  return constructRouteFromSegments(urlSegments);
}

export function parsePathname(pathname) {
  return extractPathnameSegments(pathname);
}
export function matchRoute(pathname, routes) {
  for (const route of routes) {
    const paramNames = [];
    const regexPath = route.path.replace(/:([^/]+)/g, (_, key) => {
      paramNames.push(key);
      return '([^/]+)';
    });

    const regex = new RegExp(`^${regexPath}$`);
    const match = pathname.match(regex);
    if (match) {
      const params = paramNames.reduce((acc, name, index) => {
        acc[name] = match[index + 1];
        return acc;
      }, {});
      return { route, params };
    }
  }

  return null;
}