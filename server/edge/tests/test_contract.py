import unittest

from edge.models import Detection, EdgeError, build_observation


class EdgeContractTests(unittest.TestCase):
    def test_counts_are_structured_per_product(self):
        payload = build_observation(
            Detection(marker_ids=(10, 11, 12), product_counts={"producto-a": 3}),
            observation_id="test-3",
            zone_id="zona-a",
            source_id="edge-01",
            observed_at="2026-09-24T00:00:00Z",
        )
        self.assertEqual(payload["items"], [{"productId": "producto-a", "quantity": 3}])
        self.assertEqual(payload["timestamp"], "2026-09-24T00:00:00Z")

    def test_empty_detection_cannot_become_zero_stock(self):
        with self.assertRaises(EdgeError):
            build_observation(
                Detection(marker_ids=(), product_counts={}),
                observation_id="invalid",
                zone_id="zona-a",
                source_id="edge-01",
                observed_at="2026-09-24T00:00:00Z",
            )
