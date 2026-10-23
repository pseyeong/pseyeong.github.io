package com.pseyeong.place;

import org.locationtech.proj4j.CRSFactory;
import org.locationtech.proj4j.CoordinateReferenceSystem;
import org.locationtech.proj4j.CoordinateTransform;
import org.locationtech.proj4j.CoordinateTransformFactory;
import org.locationtech.proj4j.ProjCoordinate;
import org.springframework.stereotype.Component;

@Component
public class CoordConverter {

    // EPSG:5174 (Bessel 중부원점 TM) -> WGS84(위경도)
    private static final String TM_5174 =
            "+proj=tmerc +lat_0=38 +lon_0=127.0028902777778 +k=1 +x_0=200000 +y_0=500000 "
            + "+ellps=bessel +units=m +no_defs "
            + "+towgs84=-115.80,474.99,674.11,1.16,-2.31,-1.63,6.43";
    private static final String WGS84 = "+proj=longlat +datum=WGS84 +no_defs";

    private final CoordinateTransform transform;

    public CoordConverter() {
        CRSFactory crs = new CRSFactory();
        CoordinateReferenceSystem src = crs.createFromParameters("TM5174", TM_5174);
        CoordinateReferenceSystem dst = crs.createFromParameters("WGS84", WGS84);
        this.transform = new CoordinateTransformFactory().createTransform(src, dst);
    }

    /** @return {lat, lng} */
    public double[] toLatLng(double x, double y) {
        ProjCoordinate out = new ProjCoordinate();
        transform.transform(new ProjCoordinate(x, y), out);
        return new double[] { out.y, out.x };
    }
}
