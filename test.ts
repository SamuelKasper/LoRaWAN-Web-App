function test(){
let object = JSON.parse(JSON.stringify({
    "name": "as.up.data.forward",
    "time": "2023-03-29T17:18:22.246856590Z",
    "identifiers": [
      {
        "device_ids": {
          "device_id": "dragino-lsn50-v2-s31-001",
          "application_ids": {
            "application_id": "kaspersa-hfu-bachelor-thesis"
          },
          "dev_eui": "A84041D25186841C",
          "join_eui": "A840410000000101",
          "dev_addr": "260B303A"
        }
      }
    ],
    "data": {
      "@type": "type.googleapis.com/ttn.lorawan.v3.ApplicationUp",
      "end_device_ids": {
        "device_id": "dragino-lsn50-v2-s31-001",
        "application_ids": {
          "application_id": "kaspersa-hfu-bachelor-thesis"
        },
        "dev_eui": "A84041D25186841C",
        "join_eui": "A840410000000101",
        "dev_addr": "260B303A"
      },
      "correlation_ids": [
        "as:up:01GWQ61D12SHMFS4JRW5BE8QE5",
        "gs:conn:01GWPFA97G7NMBQ6KSHQ2FXJ8A",
        "gs:up:host:01GWPFA9BCQAJYMAJ1XHGDETC6",
        "gs:uplink:01GWQ61CTGKKCT34NQ221JW81C",
        "ns:uplink:01GWQ61CTHCZXR8SCCEJF2H7V6",
        "rpc:/ttn.lorawan.v3.GsNs/HandleUplink:01GWQ61CTHR9WHW63PY6BSRE0M",
        "rpc:/ttn.lorawan.v3.NsAs/HandleUplink:01GWQ61D11Z5K0M28EQ9JNKTYZ"
      ],
      "received_at": "2023-03-29T17:18:22.241872841Z",
      "uplink_message": {
        "session_key_id": "AYcuTkiLIPvy187xFAJLTg==",
        "f_port": 2,
        "f_cnt": 2,
        "frm_payload": "Dm4AAAEPAACPAac=",
        "decoded_payload": {
          "ADC_CH0V": 0.271,
          "BatV": 3.694,
          "Digital_IStatus": "L",
          "Door_status": "OPEN",
          "EXTI_Trigger": "FALSE",
          "Hum_SHT": 42.3,
          "TempC1": 0,
          "TempC_SHT": 14.3,
          "Work_mode": "IIC"
        },
        "rx_metadata": [
          {
            "gateway_ids": {
              "gateway_id": "eui-e45f015c9d5effff",
              "eui": "E45F015C9D5EFFFF"
            },
            "time": "2023-03-29T17:18:21.999083Z",
            "timestamp": 34049523,
            "rssi": -23,
            "channel_rssi": -23,
            "snr": 7.2,
            "location": {
              "latitude": 48.0543128447682,
              "longitude": 8.20280986436687,
              "altitude": 923,
              "source": "SOURCE_REGISTRY"
            },
            "uplink_token": "CiIKIAoUZXVpLWU0NWYwMTVjOWQ1ZWZmZmYSCORfAVydXv//EPObnhAaCwje5ZGhBhCBkLUPILj6iez+9AM=",
            "channel_index": 2,
            "received_at": "2023-03-29T17:18:22.006375877Z"
          },
          {
            "gateway_ids": {
              "gateway_id": "68068734-f17f-4ec2-ac0d-5ec7332d5e4e",
              "eui": "3436323825005F00"
            },
            "time": "2023-03-29T17:17:17.843648Z",
            "timestamp": 4067867130,
            "rssi": -113,
            "channel_rssi": -113,
            "snr": -3,
            "uplink_token": "CjIKMAokNjgwNjg3MzQtZjE3Zi00ZWMyLWFjMGQtNWVjNzMzMmQ1ZTRlEgg0NjI4JQBfABD689qTDxoLCN7lkaEGEKq/7w8gkPGZ/rHnBQ==",
            "channel_index": 2,
            "received_at": "2023-03-29T17:18:22.009494015Z"
          },
          {
            "gateway_ids": {
              "gateway_id": "eui-a84041203275aeac",
              "eui": "A840412032751337"
            },
            "time": "2023-03-29T17:18:21.964457035Z",
            "timestamp": 1387127155,
            "rssi": -68,
            "channel_rssi": -68,
            "snr": 8,
            "location": {
              "latitude": 48.0543480615255,
              "longitude": 8.20293216952279,
              "altitude": 872,
              "source": "SOURCE_REGISTRY"
            },
            "uplink_token": "CiIKIAoUZXVpLWE4NDA0MTIwMzI3NWFlYWMSCKhAQSAydRM3EPPCt5UFGgsI3uWRoQYQ35vAECC40uK5r5wE",
            "received_at": "2023-03-29T17:18:22.006669472Z"
          }
        ],
        "settings": {
          "data_rate": {
            "lora": {
              "bandwidth": 125000,
              "spreading_factor": 7,
              "coding_rate": "4/5"
            }
          },
          "frequency": "868500000",
          "timestamp": 34049523,
          "time": "2023-03-29T17:18:21.999083Z"
        },
        "received_at": "2023-03-29T17:18:22.033164346Z",
        "consumed_airtime": "0.061696s",
        "version_ids": {
          "brand_id": "dragino",
          "model_id": "lsn50v2-s31",
          "hardware_version": "_unknown_hw_version_",
          "firmware_version": "1.7.4",
          "band_id": "EU_863_870"
        },
        "network_ids": {
          "net_id": "000013",
          "tenant_id": "ttn",
          "cluster_id": "eu1",
          "cluster_address": "eu1.cloud.thethings.network"
        }
      }
    },
    "correlation_ids": [
      "as:up:01GWQ61D12SHMFS4JRW5BE8QE5",
      "gs:conn:01GWPFA97G7NMBQ6KSHQ2FXJ8A",
      "gs:up:host:01GWPFA9BCQAJYMAJ1XHGDETC6",
      "gs:uplink:01GWQ61CTGKKCT34NQ221JW81C",
      "ns:uplink:01GWQ61CTHCZXR8SCCEJF2H7V6",
      "rpc:/ttn.lorawan.v3.GsNs/HandleUplink:01GWQ61CTHR9WHW63PY6BSRE0M",
      "rpc:/ttn.lorawan.v3.NsAs/HandleUplink:01GWQ61D11Z5K0M28EQ9JNKTYZ"
    ],
    "origin": "ip-10-100-12-148.eu-west-1.compute.internal",
    "context": {
      "tenant-id": "CgN0dG4="
    },
    "visibility": {
      "rights": [
        "RIGHT_APPLICATION_TRAFFIC_READ"
      ]
    },
    "unique_id": "01GWQ61D16Z21P4T2AE5M4JB67"
  }));

console.log(object.identifiers[0].device_ids.device_id);
console.log(object.data.received_at);
console.log(object.data.uplink_message.decoded_payload.Hum_SHT);
console.log(object.data.uplink_message.decoded_payload.TempC_SHT);
console.log(object.data.uplink_message.rx_metadata[0].gateway_ids.gateway_id);
};

test();